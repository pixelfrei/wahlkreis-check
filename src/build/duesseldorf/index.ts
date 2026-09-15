import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import {
  DUESSELDORF_QUELLE_STAND,
  DUESSELDORF_QUELLE_URL,
  DUESSELDORF_WAHLKREISE,
} from "./config.js";
import {
  BuildError,
  entferneUeberfluessigeAdresslose,
  gruppiereZuStrasse,
  istUnaufloesbarAdresslos,
  type RohZeile,
} from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { duesseldorfZeileZuRohZeilen, type DuesseldorfZeile } from "./parse.js";

const OUTPUT_PATH = "public/data/duesseldorf.json";

function feld(s: string): string | null {
  const t = s.trim();
  return t.length > 0 ? t : null;
}

function parseZeile(spalten: string[]): DuesseldorfZeile | null {
  const strasse = feld(spalten[2] ?? "");
  const stadtbezirk = feld(spalten[14] ?? "");
  const stadtteilname = feld(spalten[13] ?? "");
  if (!strasse || !stadtbezirk || !stadtteilname) return null;

  return {
    strasse,
    stadtbezirk,
    stadtteilname,
    ungeradeVon: feld(spalten[3] ?? ""),
    ungeradeVonZus: feld(spalten[4] ?? "") ?? "",
    ungeradeBis: feld(spalten[5] ?? ""),
    geradeVon: feld(spalten[7] ?? ""),
    geradeVonZus: feld(spalten[8] ?? "") ?? "",
    geradeBis: feld(spalten[9] ?? ""),
  };
}

async function ladeZeilen(): Promise<DuesseldorfZeile[]> {
  const response = await fetch(DUESSELDORF_QUELLE_URL);
  if (!response.ok) {
    throw new BuildError(
      `Download fehlgeschlagen (${response.status}): ${DUESSELDORF_QUELLE_URL}`,
    );
  }
  const text = await response.text();
  const zeilen = text.split(/\r?\n/).filter((z) => z.length > 0);
  const [, ...datenzeilen] = zeilen; // erste Zeile ist der Spaltenkopf

  const ergebnis: DuesseldorfZeile[] = [];
  for (const zeile of datenzeilen) {
    const spalten = zeile.split(";");
    if (spalten.length !== 15) {
      throw new BuildError(`Zeile mit ${spalten.length} statt 15 Spalten: "${zeile}"`);
    }
    const geparst = parseZeile(spalten);
    if (geparst) ergebnis.push(geparst);
  }
  return ergebnis;
}

async function main(): Promise<void> {
  console.log("Lade Düsseldorfer Straßenverzeichnis ...");
  const zeilen = await ladeZeilen();
  console.log(`  ${zeilen.length} Zeilen geladen.`);

  const byStrasse = new Map<string, RohZeile[]>();
  for (const zeile of zeilen) {
    const rohZeilen = duesseldorfZeileZuRohZeilen(zeile);
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

  checkWahlkreisCount(DUESSELDORF_WAHLKREISE, 4);

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
      kommune: "Düsseldorf",
      stand: DUESSELDORF_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [DUESSELDORF_QUELLE_URL],
      // Straße -> Stadtteil aus offenen Daten, Stadtteil -> Wahlkreis aus der
      // Landeswahlgesetz-Anlage (siehe wahlkreis.ts) - zweistufig, nicht direkt amtlich.
      zuordnung: "gesetzesanlage",
    },
    wahlkreise: DUESSELDORF_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Zeilen Straßenverzeichnis: ${zeilen.length}`);
  console.log(`Straßen gesamt: ${strassen.length}`);
  if (uebersprungen.length > 0) {
    console.log(
      `Übersprungen (adresslos, mehrere Wahlkreise, z.B. Brücken/Tunnel): ${uebersprungen.length}`,
    );
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
