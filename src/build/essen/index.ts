import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { ESSEN_QUELLE_STAND, ESSEN_STRASSEN_URL, ESSEN_WAHLKREISE } from "./config.js";
import { berichteBuchstaben, buchstabenAusZeilen } from "../buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { parseHausnummernBereich } from "../freitextBereich.js";
import { entmangleBereich, repariereDoppelteKodierung } from "./parse.js";
import { wahlkreisFuer } from "./stadtteile.js";

const OUTPUT_PATH = "public/data/essen.json";

/**
 * Bekannter Fehler in der Quelle: Wittenbergstr., Bezirk 1402 (Stadtteil 14
 * Stadtwald), trägt den Bereich "107,14" - Hausnummer 14 ist aber bereits
 * über Bezirk 1013 (Stadtteil 10 Rüttenscheid, "2-58 ger.") vollständig und
 * mit anderer PLZ (45131 statt 45133) abgedeckt. Die "14" in Bezirk 1402
 * sieht nach einem Datenfehler der Stadt aus (evtl. eine abgeschnittene
 * größere Zahl) und wird hier entfernt, damit Hausnummer 14 eindeutig bei
 * Rüttenscheid bleibt.
 */
const KORRIGIERTE_BEREICHE = new Map<string, string>([["Wittenbergstr.|1402", "107"]]);

interface EssenZeile {
  strasse: string;
  hausnummernBereich: string;
  bezirkNr: string;
}

function parseZeile(spalten: string[]): EssenZeile | null {
  const strasse = spalten[1]?.trim();
  const bezirkNr = spalten[4]?.trim();
  if (!strasse || !bezirkNr) return null;
  return { strasse, hausnummernBereich: spalten[2]?.trim() ?? "", bezirkNr };
}

async function ladeZeilen(): Promise<EssenZeile[]> {
  const response = await fetch(ESSEN_STRASSEN_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${ESSEN_STRASSEN_URL}`);
  }
  const buffer = await response.arrayBuffer();
  // Datei beginnt mit einer UTF-8-BOM und ist doppelt kodiert.
  const text = repariereDoppelteKodierung(
    new TextDecoder("utf-8").decode(buffer).replace(/^﻿/, ""),
  );
  const zeilen = text.split(/\r?\n/).filter((z) => z.length > 0);
  const [, ...datenzeilen] = zeilen; // erste Zeile ist der Spaltenkopf

  const ergebnis: EssenZeile[] = [];
  for (const zeile of datenzeilen) {
    const spalten = zeile.split(";");
    if (spalten.length !== 5) {
      throw new BuildError(`Zeile mit ${spalten.length} statt 5 Spalten: "${zeile}"`);
    }
    const geparst = parseZeile(spalten);
    if (geparst) ergebnis.push(geparst);
  }
  return ergebnis;
}

async function main(): Promise<void> {
  console.log("Lade Essener Straßenverzeichnis ...");
  const zeilen = await ladeZeilen();
  console.log(`  ${zeilen.length} Zeilen geladen.`);

  const byStrasse = new Map<string, RohZeile[]>();
  for (const zeile of zeilen) {
    const stadtteilNr = Math.floor(parseInt(zeile.bezirkNr, 10) / 100);
    const wk = wahlkreisFuer(stadtteilNr);
    const bereich = KORRIGIERTE_BEREICHE.get(`${zeile.strasse}|${zeile.bezirkNr}`) ?? zeile.hausnummernBereich;
    const rohZeilen = parseHausnummernBereich(entmangleBereich(bereich), wk);
    const liste = byStrasse.get(zeile.strasse) ?? [];
    liste.push(...rohZeilen);
    byStrasse.set(zeile.strasse, liste);
  }

  const strassen: Strasse[] = [];
  for (const [name, rows] of byStrasse) {
    strassen.push(gruppiereZuStrasse(name, rows));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));
  await berichteBuchstaben("Essen", buchstabenAusZeilen(byStrasse), strassen);

  checkWahlkreisCount(ESSEN_WAHLKREISE, 4);

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
      kommune: "Essen",
      stand: ESSEN_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [ESSEN_STRASSEN_URL],
      // Straße -> Stimmbezirk aus dem Straßenverzeichnis, Stimmbezirk ->
      // Stadtteil-Nummer (durch 100 geteilt) -> Landtagswahlkreis aus der
      // Landeswahlgesetz-Anlage (siehe stadtteile.ts).
      zuordnung: "gesetzesanlage",
    },
    wahlkreise: ESSEN_WAHLKREISE,
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
