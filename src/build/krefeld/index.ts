import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { KREFELD_QUELLE_STAND, KREFELD_STRASSEN_URL, KREFELD_WAHLKREISE } from "./config.js";
import { berichteBuchstaben, buchstabenAusZeilen } from "../buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { wahlkreisFuer } from "./wahlkreis.js";

const OUTPUT_PATH = "public/data/krefeld.json";

interface KrefeldZeile {
  strasse: string;
  stadtbezirk: string;
}

/**
 * Jede Datenzeile beginnt mit dem numerischen Straßenschlüssel; alle
 * anderen Zeilen (Titel, Kopfzeilen, Leerzeilen zwischen den Einträgen)
 * werden verworfen.
 */
function parseZeile(zeile: string): KrefeldZeile | null {
  const spalten = zeile.split(";");
  if (!/^\d+$/.test(spalten[0] ?? "")) return null;

  // Ein einzelner Eintrag ("Rhodiusstraße") trägt den Namen in
  // Anführungszeichen mit eingebetteten Tabs (Excel-Formatierungsrest) -
  // Anführungszeichen entfernen und Whitespace normalisieren.
  const strasse = spalten[1]
    ?.trim()
    .replace(/^"|"$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const stadtbezirk = spalten[9]?.trim();
  if (!strasse || !stadtbezirk) return null;
  return { strasse, stadtbezirk };
}

async function ladeZeilen(): Promise<KrefeldZeile[]> {
  const response = await fetch(KREFELD_STRASSEN_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${KREFELD_STRASSEN_URL}`);
  }
  const buffer = await response.arrayBuffer();
  const text = new TextDecoder("iso-8859-1").decode(buffer);

  const ergebnis: KrefeldZeile[] = [];
  for (const zeile of text.split(/\r?\n/)) {
    const geparst = parseZeile(zeile);
    if (geparst) ergebnis.push(geparst);
  }
  return ergebnis;
}

async function main(): Promise<void> {
  console.log("Lade Krefelder Straßenverzeichnis ...");
  const zeilen = await ladeZeilen();
  console.log(`  ${zeilen.length} Zeilen geladen.`);

  const byStrasse = new Map<string, RohZeile[]>();
  for (const zeile of zeilen) {
    const wk = wahlkreisFuer(zeile.stadtbezirk);
    const liste = byStrasse.get(zeile.strasse) ?? [];
    liste.push({ von: null, bis: null, par: null, wk });
    byStrasse.set(zeile.strasse, liste);
  }

  const strassen: Strasse[] = [];
  for (const [name, rows] of byStrasse) {
    strassen.push(gruppiereZuStrasse(name, rows));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));
  await berichteBuchstaben("Krefeld", buchstabenAusZeilen(byStrasse), strassen);

  checkWahlkreisCount(KREFELD_WAHLKREISE, 2);

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

  const data: StrassenDaten = {
    meta: {
      kommune: "Krefeld",
      stand: KREFELD_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [KREFELD_STRASSEN_URL],
      // Straße -> Stadtbezirk-Nummer direkt aus dem Straßenverzeichnis,
      // Stadtbezirk -> Landtagswahlkreis aus der aktuellen
      // Landeswahlgesetz-Anlage (siehe wahlkreis.ts) - die im Verzeichnis
      // selbst genannten Landtagswahlkreis-Nummern sind veraltet (vor der
      // Wahlkreisreform 2021) und werden nicht verwendet.
      zuordnung: "gesetzesanlage",
    },
    wahlkreise: KREFELD_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Zeilen Straßenverzeichnis: ${zeilen.length}`);
  console.log(`Straßen gesamt: ${strassen.length}`);
  console.log(`Mehrdeutige Treffer im Vollscan: ${conflicts.length}`);
  if (gaps.length > 0) {
    console.log(`\nWarnung: ${gaps.length} Lücke(n) in Hausnummernbereichen.`);
  }
  console.log(`\n${OUTPUT_PATH} geschrieben.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
