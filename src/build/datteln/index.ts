import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { DATTELN_QUELLE_STAND, DATTELN_STRASSEN_URL, DATTELN_WAHLKREISE } from "./config.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { parseHausnummernBereich } from "../freitextBereich.js";
import { wahlkreisFuer } from "./wahlkreis.js";

const OUTPUT_PATH = "public/data/datteln.json";

interface DattelnZeile {
  strasse: string;
  hausnummernBereich: string;
  bezirkNr: string;
}

function parseZeile(spalten: string[]): DattelnZeile | null {
  const strasse = spalten[2]?.trim();
  const bezirkNr = spalten[6]?.trim();
  if (!strasse || !bezirkNr) return null;
  return { strasse, hausnummernBereich: spalten[3]?.trim() ?? "", bezirkNr };
}

async function ladeZeilen(): Promise<DattelnZeile[]> {
  const response = await fetch(DATTELN_STRASSEN_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${DATTELN_STRASSEN_URL}`);
  }
  const text = await response.text();
  const zeilen = text.split(/\r?\n/).filter((z) => z.length > 0);
  const [, ...datenzeilen] = zeilen; // erste Zeile ist der Spaltenkopf

  const ergebnis: DattelnZeile[] = [];
  for (const zeile of datenzeilen) {
    const spalten = zeile.split(";");
    if (spalten.length !== 7) {
      throw new BuildError(`Zeile mit ${spalten.length} statt 7 Spalten: "${zeile}"`);
    }
    const geparst = parseZeile(spalten);
    if (geparst) ergebnis.push(geparst);
  }
  return ergebnis;
}

async function main(): Promise<void> {
  console.log("Lade Dattelner Straßenverzeichnis ...");
  const zeilen = await ladeZeilen();
  console.log(`  ${zeilen.length} Zeilen geladen.`);

  const byStrasse = new Map<string, RohZeile[]>();
  for (const zeile of zeilen) {
    const wk = wahlkreisFuer(zeile.bezirkNr);
    const rohZeilen = parseHausnummernBereich(zeile.hausnummernBereich, wk);
    const liste = byStrasse.get(zeile.strasse) ?? [];
    liste.push(...rohZeilen);
    byStrasse.set(zeile.strasse, liste);
  }

  const strassen: Strasse[] = [];
  for (const [name, rows] of byStrasse) {
    strassen.push(gruppiereZuStrasse(name, rows));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));

  checkWahlkreisCount(DATTELN_WAHLKREISE, 2);

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
      kommune: "Datteln",
      stand: DATTELN_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [DATTELN_STRASSEN_URL],
      // Straße -> Wahlbezirk aus dem Kommunalwahl-Verzeichnis, Wahlbezirk 1 ->
      // Stadtbezirke Ahsen/Bauerschaft Ostleven (starkes, aber kein amtlich-
      // explizites Indiz, siehe wahlkreis.ts) -> Landtagswahlkreis aus der
      // Landeswahlgesetz-Anlage.
      zuordnung: "gesetzesanlage",
    },
    wahlkreise: DATTELN_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Zeilen Straßenverzeichnis: ${zeilen.length}`);
  console.log(`Straßen gesamt: ${strassen.length}`);
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
