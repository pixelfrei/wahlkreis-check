import { writeFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { GLADBECK_QUELLE_STAND, GLADBECK_QUELLE_URL, GLADBECK_WAHLKREISE } from "./config.js";
import { berichteBuchstaben, buchstabenAusZeilen } from "../buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { gladbeckZeileZuRohZeile, parseZeile } from "./parse.js";
import { wahlkreisFuer } from "./wahlkreis.js";

const OUTPUT_PATH = "public/data/gladbeck.json";

// Kopf-/Fußzeilen des Amtsblatt-PDF (Seitenmarker, Seitenzahlen, Titelblatt,
// Spaltenkopf) - keine Datenzeilen.
const KWB_HEADER_RE = /^Kommunalwahlbezirk (\d+) [-–—] (.+)$/;
const PAGE_MARKER_RE = /^-- \d+ of \d+ --$/;
const PAGE_NUMBER_RE = /^\d+$/;
const PREAMBEL_PRAEFIXE = [
  "Amtliche",
  "Wahlbezirksverzeichnis",
  "der Stadt",
  "Straßenebene",
  "zur Kommunalwahl",
  "Ausgabe",
  "Der Wahlausschuss",
  "biet für",
  "(siehe",
  "Gladbeck, den",
  "Die Wahlleiterin",
  "Bettina Weist",
  "Kommunalwahlen 2025",
  "Straße Hausnummernbereich",
];

interface RohZeileMitStrasse extends RohZeile {
  strasse: string;
}

async function ladeRohtext(): Promise<string> {
  const response = await fetch(GLADBECK_QUELLE_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${GLADBECK_QUELLE_URL}`);
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
 * Das Wahlbezirksverzeichnis endet im PDF mittendrin - danach folgt eine
 * unabhängige Bekanntmachung eines Wasser- und Bodenverbands im selben
 * Amtsblatt. Ab da wird nicht mehr geparst.
 */
function istEndeDesVerzeichnisses(line: string): boolean {
  return line.includes("Bekanntmachung des") || line.includes("Wasser- und Bodenverband");
}

async function ladeZeilen(): Promise<RohZeileMitStrasse[]> {
  const text = await ladeRohtext();
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let aktuellerKwb: string | null = null;
  const ergebnis: RohZeileMitStrasse[] = [];

  for (const line of lines) {
    if (PAGE_MARKER_RE.test(line) || PAGE_NUMBER_RE.test(line)) continue;

    const kwbMatch = KWB_HEADER_RE.exec(line);
    if (kwbMatch) {
      aktuellerKwb = kwbMatch[1]!;
      continue;
    }
    if (aktuellerKwb === null) continue; // Titelblatt vor dem ersten Bezirk

    if (istEndeDesVerzeichnisses(line)) break;
    if (PREAMBEL_PRAEFIXE.some((p) => line.startsWith(p))) continue;

    const zeile = parseZeile(line);
    const wk = wahlkreisFuer(aktuellerKwb);
    ergebnis.push({ ...gladbeckZeileZuRohZeile(zeile, wk), strasse: zeile.strasse });
  }

  return ergebnis;
}

async function main(): Promise<void> {
  console.log("Lade Gladbecker Wahlbezirksverzeichnis (PDF) ...");
  const zeilen = await ladeZeilen();
  console.log(`  ${zeilen.length} Zeilen geladen.`);

  const byStrasse = new Map<string, RohZeile[]>();
  for (const { strasse, ...rohZeile } of zeilen) {
    const liste = byStrasse.get(strasse) ?? [];
    liste.push(rohZeile);
    byStrasse.set(strasse, liste);
  }

  const strassen: Strasse[] = [];
  for (const [name, rows] of byStrasse) {
    strassen.push(gruppiereZuStrasse(name, rows));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));
  await berichteBuchstaben("Gladbeck", buchstabenAusZeilen(byStrasse), strassen);

  checkWahlkreisCount(GLADBECK_WAHLKREISE, 2);

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
      kommune: "Gladbeck",
      stand: GLADBECK_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [GLADBECK_QUELLE_URL],
      // Straße -> Kommunalwahlbezirk (mit Stadtbezirksname) aus dem amtlichen
      // Wahlbezirksverzeichnis, Stadtbezirk -> Landtagswahlkreis aus der
      // Landeswahlgesetz-Anlage (siehe wahlkreis.ts).
      zuordnung: "gesetzesanlage",
    },
    wahlkreise: GLADBECK_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Zeilen Wahlbezirksverzeichnis: ${zeilen.length}`);
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
