import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { HAGEN_QUELLE_STAND, HAGEN_STRASSEN_URL, HAGEN_WAHLKREISE } from "./config.js";
import { ergaenzeBuchstabenAusnahmen, buchstabenAusZeilen } from "../buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { parseHausnummernBereich } from "../freitextBereich.js";
import { wahlkreisFuer } from "./wahlkreis.js";

const OUTPUT_PATH = "public/data/hagen.json";

/**
 * Zwei echte Datenkonflikte im Vollscan, beide durch eine gezielte Korrektur
 * behoben (kein Muster, das sich verallgemeinern ließe - siehe Münster/Essen-
 * Präzedenzfälle):
 *
 * - Buntebachstr., Bezirk 4211 (WB21, WK104): "31a,42,45a-111" enthält die
 *   Einzeladresse "31a" (Buchstabenzusatz, keine Bereichsgrenze - Basisnummer
 *   bleibt 31). Das kollidiert numerisch mit der Hausnummer 31 aus Bezirk
 *   4205 (WB20, WK103) "5-31,32-38,43", die plain "31" bereits eindeutig
 *   abdeckt. "31a" wird deshalb nicht als Hausnummer 31 geführt, sondern als
 *   Buchstaben-Ausnahme (BUCHSTABEN_AUSNAHMEN unten) - "31" bleibt WK103,
 *   "31a" WK104.
 * - Franzstr., Bezirk 4204 (WB20, WK103): "1b-54,60-70 ger.,72-76" - das
 *   letzte Segment "72-76" trägt (anders als das direkt davor stehende
 *   "60-70 ger.") keinen Paritäts-Hinweis, wirkt also wie ein fehlendes
 *   "ger." (Tippfehler/Auslassung in der Quelle). Es kollidiert dadurch mit
 *   den ungeraden Hausnummern 73 und 75 aus Bezirk 4211 (WB21, WK104)
 *   "55-121 ung.". Korrigiert zu "72-76 ger.".
 */
const KORRIGIERTE_BEREICHE = new Map<string, string>([
  ["Buntebachstr.|4211", "42,45a-111"],
  ["Franzstr.|4204", "1b-54,60-70 ger.,72-76 ger."],
]);

/** Einzeladressen mit Buchstabe, die oben aus den Bereichen entfernt wurden. */
const BUCHSTABEN_AUSNAHMEN = [{ strasse: "Buntebachstr.", nummer: 31, zusatz: "a", bezirkNr: 4211 }];

interface HagenZeile {
  strasse: string;
  hausnummernBereich: string;
  bezirkNr: number;
}

function parseZeile(spalten: string[]): HagenZeile | null {
  const strasse = spalten[2]?.trim();
  const bezirkNrStr = spalten[6]?.trim();
  if (!strasse || !bezirkNrStr || !/^\d+$/.test(bezirkNrStr)) return null;
  return {
    strasse,
    hausnummernBereich: spalten[3]?.trim() ?? "",
    bezirkNr: parseInt(bezirkNrStr, 10),
  };
}

async function ladeZeilen(): Promise<HagenZeile[]> {
  const response = await fetch(HAGEN_STRASSEN_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${HAGEN_STRASSEN_URL}`);
  }
  const text = await response.text();
  const zeilen = text.split(/\r?\n/).filter((z) => z.length > 0);
  const [, ...datenzeilen] = zeilen; // erste Zeile ist der Spaltenkopf

  const ergebnis: HagenZeile[] = [];
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
  console.log("Lade Hagener Straßenverzeichnis ...");
  const zeilen = await ladeZeilen();
  console.log(`  ${zeilen.length} Zeilen geladen.`);

  const byStrasse = new Map<string, RohZeile[]>();
  for (const zeile of zeilen) {
    const wk = wahlkreisFuer(zeile.bezirkNr);
    const bereich =
      KORRIGIERTE_BEREICHE.get(`${zeile.strasse}|${zeile.bezirkNr}`) ?? zeile.hausnummernBereich;
    const rohZeilen = parseHausnummernBereich(bereich, wk);
    const liste = byStrasse.get(zeile.strasse) ?? [];
    liste.push(...rohZeilen);
    byStrasse.set(zeile.strasse, liste);
  }

  const strassen: Strasse[] = [];
  for (const [name, rows] of byStrasse) {
    strassen.push(gruppiereZuStrasse(name, rows));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));
  const buchstabenAdressen = [
    ...buchstabenAusZeilen(byStrasse),
    ...BUCHSTABEN_AUSNAHMEN.map(({ bezirkNr, ...a }) => ({ ...a, wk: wahlkreisFuer(bezirkNr) })),
  ];
  await ergaenzeBuchstabenAusnahmen("Hagen", buchstabenAdressen, strassen);

  checkWahlkreisCount(HAGEN_WAHLKREISE, 2);

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
      kommune: "Hagen",
      stand: HAGEN_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [HAGEN_STRASSEN_URL],
      // Straße -> Bezirk-Nr aus dem Straßenverzeichnis, Bezirk-Nr ->
      // Wahlbezirk (mittlere zwei Ziffern) -> Landtagswahlkreis aus der
      // Landeswahlgesetz-Anlage (siehe wahlkreis.ts).
      zuordnung: "gesetzesanlage",
    },
    wahlkreise: HAGEN_WAHLKREISE,
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
