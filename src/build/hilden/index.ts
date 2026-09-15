import { writeFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { HILDEN_QUELLE_STAND, HILDEN_WAHLBUCH_URL, HILDEN_WAHLKREISE } from "./config.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { parseWahlbuch } from "./parse.js";
import { wahlkreisFuerWahlbezirk } from "./wahlkreis.js";

const OUTPUT_PATH = "public/data/hilden.json";

/**
 * Ein echter Überlappungskonflikt in der Vorlage: Wahlbezirk 3080 nennt
 * "Hochdahler Straße 1 - 47 ungerade", Wahlbezirk 3170 (weiter unten im
 * Dokument) "Hochdahler Straße 46 - 69 ungerade" - beide erfassen
 * Hausnummer 47. Die untere Grenze "46" von WB3170 ist selbst gerade (für
 * einen "ungerade"-Bereich unüblich) und deutet darauf hin, dass die
 * eigentlich gemeinte Grenze zwischen den Bezirken bei 45/46 liegt, nicht
 * bei 47/48 - WB3080s Obergrenze "47" wird daher auf "45" korrigiert
 * (analog zum Wittenbergstr.-Fall bei Essen: gezielte Korrektur eines
 * einzelnen erkannten Fehlers, keine allgemeine Regel).
 */
function korrigiere(wahlbezirk: number, strasse: string, rohZeile: RohZeile): RohZeile {
  if (wahlbezirk === 3080 && strasse === "Hochdahler Straße" && rohZeile.bis === 47) {
    return { ...rohZeile, bis: 45 };
  }
  return rohZeile;
}

async function ladeWahlbuchText(): Promise<string> {
  const response = await fetch(HILDEN_WAHLBUCH_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${HILDEN_WAHLBUCH_URL}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

async function main(): Promise<void> {
  console.log("Lade Hildener Wahlbezirks-PDF ...");
  const text = await ladeWahlbuchText();
  const zeilen = parseWahlbuch(text);
  console.log(`  ${zeilen.length} Straßenzeilen aus 20 Wahlbezirken geparst.`);

  const byStrasse = new Map<string, RohZeile[]>();
  for (const z of zeilen) {
    const wk = wahlkreisFuerWahlbezirk(z.wahlbezirk);
    const rohZeile = korrigiere(z.wahlbezirk, z.strasse, { ...z.rohZeile, wk });
    const liste = byStrasse.get(z.strasse) ?? [];
    liste.push(rohZeile);
    byStrasse.set(z.strasse, liste);
  }

  const strassen: Strasse[] = [];
  for (const [name, rows] of byStrasse) {
    strassen.push(gruppiereZuStrasse(name, rows));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));

  checkWahlkreisCount(HILDEN_WAHLKREISE, 2);

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
      kommune: "Hilden",
      stand: HILDEN_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [HILDEN_WAHLBUCH_URL],
      // Straße -> Wahlbezirk direkt aus der amtlichen Beschlussvorlage,
      // Wahlbezirk -> Landtagswahlkreis aus der Landeswahlgesetz-Anlage
      // (siehe wahlkreis.ts). Keine Geometrie-Berechnung nötig - die
      // Vorlage selbst listet die Straßen pro Wahlbezirk.
      zuordnung: "gesetzesanlage",
    },
    wahlkreise: HILDEN_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Straßenzeilen: ${zeilen.length}`);
  console.log(`Straßen gesamt: ${strassen.length}`);
  console.log(`  davon in genau einem Wahlkreis: ${eindeutig}`);
  console.log(`  davon über mehrere Wahlkreise: ${geteilt}`);
  console.log(`Mehrdeutige Treffer im Vollscan: ${conflicts.length}`);
  if (gaps.length > 0) {
    console.log(`\nWarnung: ${gaps.length} Lücke(n) in Hausnummernbereichen (nur erste 20):`);
    for (const g of gaps.slice(0, 20)) {
      console.log(`  - ${g.strasse}: ${g.von}-${g.bis} nicht abgedeckt`);
    }
  }
  console.log(`\n${OUTPUT_PATH} geschrieben.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
