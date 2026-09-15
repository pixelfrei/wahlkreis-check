import { writeFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { HAMM_QUELLE_STAND, HAMM_QUELLE_URL, HAMM_WAHLKREISE } from "./config.js";
import { ergaenzeBuchstabenAusnahmen, buchstabenAusZeilen } from "../buchstabenPruefung.js";
import {
  BuildError,
  entferneUeberfluessigeAdresslose,
  gruppiereZuStrasse,
  istUnaufloesbarAdresslos,
  type RohZeile,
} from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { hammZeileZuRohZeilen, parseZeile } from "./parse.js";

const OUTPUT_PATH = "public/data/hamm.json";

async function ladeRohtext(): Promise<string> {
  const response = await fetch(HAMM_QUELLE_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${HAMM_QUELLE_URL}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

/**
 * Aus dem Fließtext des PDF nur die eigentlichen Datenzeilen herausfiltern.
 * Kopf-/Fußzeilen ("Kommunalwahlbezirke 2025", Spaltenköpfe, Seitenzahlen,
 * Fußnote) haben immer 1, 2 oder 4 Tab-getrennte Felder und beginnen nicht
 * mit einer reinen Kommunalwahlbezirk-Nummer - echte Datenzeilen haben 3, 5,
 * 6 oder 7 Felder (siehe parse.ts für die 6-Felder-Sonderfälle).
 */
function istDatenzeile(fields: string[]): boolean {
  if (![3, 5, 6, 7].includes(fields.length)) return false;
  return /^\d+$/.test(fields[0]!.trim());
}

async function ladeZeilen(): Promise<ReturnType<typeof parseZeile>[]> {
  const text = await ladeRohtext();
  const zeilen: ReturnType<typeof parseZeile>[] = [];
  for (const zeile of text.split(/\r?\n/)) {
    const fields = zeile.split("\t");
    if (!istDatenzeile(fields)) continue;
    zeilen.push(parseZeile(fields));
  }
  return zeilen;
}

async function main(): Promise<void> {
  console.log("Lade Hammer Straßenverzeichnis (PDF) ...");
  const zeilen = await ladeZeilen();
  console.log(`  ${zeilen.length} Zeilen geladen.`);

  const byStrasse = new Map<string, RohZeile[]>();
  for (const zeile of zeilen) {
    const rohZeilen = hammZeileZuRohZeilen(zeile);
    const liste = byStrasse.get(zeile.strasse) ?? [];
    liste.push(...rohZeilen);
    byStrasse.set(zeile.strasse, liste);
  }

  const strassen: Strasse[] = [];
  const uebersprungen: string[] = [];
  for (const [name, rows] of byStrasse) {
    if (istUnaufloesbarAdresslos(rows)) {
      uebersprungen.push(name);
      continue;
    }
    strassen.push(gruppiereZuStrasse(name, entferneUeberfluessigeAdresslose(rows)));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));
  await ergaenzeBuchstabenAusnahmen("Hamm", buchstabenAusZeilen(byStrasse), strassen);

  checkWahlkreisCount(HAMM_WAHLKREISE, 2);

  const conflicts = runVollscan(strassen);
  if (conflicts.length > 0) {
    for (const c of conflicts) {
      console.error(
        `Mehrdeutiger Treffer: ${c.strasse} Hausnummer ${c.hausnummer} -> ${c.wks.join(", ")}`,
      );
    }
    throw new BuildError(`${conflicts.length} mehrdeutige Treffer im Vollscan.`);
  }

  const gaps = findGaps(strassen);

  const distinctWkCount = (s: Strasse): number =>
    "wk" in s ? 1 : new Set(s.b.map((b) => b.wk).filter((wk) => wk !== null)).size;
  const eindeutig = strassen.filter((s) => distinctWkCount(s) === 1).length;
  const geteilt = strassen.length - eindeutig;

  const data: StrassenDaten = {
    meta: {
      kommune: "Hamm",
      stand: HAMM_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [HAMM_QUELLE_URL],
      // Straße -> Stadtbezirk direkt aus dem Kommunalwahl-Verzeichnis, Stadtbezirk
      // -> Landtagswahlkreis aus der Landeswahlgesetz-Anlage (siehe wahlkreis.ts).
      zuordnung: "gesetzesanlage",
    },
    wahlkreise: HAMM_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Zeilen Straßenverzeichnis: ${zeilen.length}`);
  console.log(`Straßen gesamt: ${strassen.length}`);
  if (uebersprungen.length > 0) {
    console.log(`Übersprungen (adresslos, mehrere Wahlkreise): ${uebersprungen.length}`);
    for (const name of uebersprungen) {
      console.log(`  - ${name}`);
    }
  }
  console.log(`  davon in genau einem Wahlkreis: ${eindeutig}`);
  console.log(`  davon über mehrere Wahlkreise: ${geteilt}`);
  console.log(`Mehrdeutige Treffer im Vollscan: ${conflicts.length}`);
  if (gaps.length > 0) {
    console.log(`\nWarnung: ${gaps.length} Lücke(n) in Hausnummernbereichen:`);
    for (const g of gaps) {
      console.log(`  - ${g.strasse}: ${g.von}-${g.bis} nicht abgedeckt`);
    }
  }
  console.log(`\n${OUTPUT_PATH} geschrieben.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
