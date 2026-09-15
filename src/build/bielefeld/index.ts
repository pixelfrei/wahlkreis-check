import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import {
  BIELEFELD_ADRESSEN_URL,
  BIELEFELD_LWK_URL,
  BIELEFELD_QUELLE_STAND,
  BIELEFELD_WAHLKREISE,
} from "./config.js";
import { ergaenzeBuchstabenAusnahmen, type BuchstabenAdresse } from "../buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { baueBenanntesPolygon, findePolygon, parseWktPoint, type BenanntesPolygon } from "../geo.js";
import { parseHausnummer } from "./parse.js";

const OUTPUT_PATH = "public/data/bielefeld.json";

/** Sehr einfacher CSV-Parser: reicht für die hier verwendeten WFS-CSV-Exporte
 * (";"-getrennt, keine Feldwerte mit eingebettetem ";" oder Zeilenumbruch). */
function parseCsv(text: string): { header: string[]; zeilen: string[][] } {
  const zeilen = text
    .split(/\r?\n/)
    .filter((z) => z.length > 0)
    .map((zeile) => zeile.split(";").map((feld) => feld.trim().replace(/^"|"$/g, "")));
  const [header, ...rest] = zeilen;
  return { header: header ?? [], zeilen: rest };
}

function spaltenIndex(header: string[], name: string): number {
  const idx = header.indexOf(name);
  if (idx === -1) throw new BuildError(`Spalte "${name}" nicht gefunden: ${header.join(", ")}`);
  return idx;
}

async function ladeCsv(url: string): Promise<{ header: string[]; zeilen: string[][] }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${url}`);
  }
  return parseCsv(await response.text());
}

async function ladeWahlkreisPolygone(): Promise<BenanntesPolygon[]> {
  const { header, zeilen } = await ladeCsv(BIELEFELD_LWK_URL);
  const wktIdx = spaltenIndex(header, "WKT");
  const wkIdx = spaltenIndex(header, "landtagswahlkr");
  return zeilen.map((z) => baueBenanntesPolygon(z[wkIdx]!, z[wktIdx]!));
}

interface Adresspunkt {
  strasse: string;
  hausnummer: number;
  suffix: string;
  punkt: readonly [number, number];
}

async function ladeAdresspunkte(): Promise<Adresspunkt[]> {
  const { header, zeilen } = await ladeCsv(BIELEFELD_ADRESSEN_URL);
  const wktIdx = spaltenIndex(header, "WKT");
  const strasseIdx = spaltenIndex(header, "strasse");
  const hausnrIdx = spaltenIndex(header, "hausnr");

  const ergebnis: Adresspunkt[] = [];
  for (const z of zeilen) {
    const geparst = parseHausnummer(z[hausnrIdx] ?? "");
    if (!geparst) continue;
    ergebnis.push({
      strasse: z[strasseIdx]!,
      hausnummer: geparst.hausnummer,
      suffix: geparst.suffix,
      punkt: parseWktPoint(z[wktIdx]!),
    });
  }
  return ergebnis;
}

/** Adressen mit Buchstabenzusatz und ihrem berechneten Wahlkreis (für die Buchstaben-Prüfung). */
const buchstabenAdressen: BuchstabenAdresse[] = [];

interface HausnummerEintrag {
  wk: string;
  istUnbuchstabiert: boolean;
}

/**
 * Wie bei Bochum: eine unbuchstabierte Zeile (z.B. "Holbeinstraße 2") ist
 * immer maßgeblich gegenüber buchstabierten Varianten ("2a", "2b", ...) an
 * derselben Hausnummer, falls die per Punkt-in-Polygon ermittelten
 * Wahlkreise auseinanderfallen (unser Datenmodell kennt bei Einzeladressen
 * keinen Buchstabenzusatz). Betrifft 2 von rund 60.000 eindeutigen
 * Hausnummern: Holbeinstraße 2, Windfang 75.
 */
function baueHausnummernProStrasse(
  punkte: Adresspunkt[],
  polygone: BenanntesPolygon[],
): { byStrasse: Map<string, Map<number, string>>; ohneTreffer: number; mehrdeutig: number } {
  const byStrasse = new Map<string, Map<number, HausnummerEintrag>>();
  let ohneTreffer = 0;
  let mehrdeutig = 0;

  for (const p of punkte) {
    const treffer = findePolygon(p.punkt, polygone);
    if (treffer.length === 0) {
      ohneTreffer++;
      continue;
    }
    if (treffer.length > 1) {
      mehrdeutig++;
      continue;
    }
    const wk = treffer[0]!;
    const istUnbuchstabiert = p.suffix === "";
    if (!istUnbuchstabiert) {
      buchstabenAdressen.push({ strasse: p.strasse, nummer: p.hausnummer, zusatz: p.suffix.trim().toLowerCase(), wk });
    }
    const hausnummern = byStrasse.get(p.strasse) ?? new Map<number, HausnummerEintrag>();
    byStrasse.set(p.strasse, hausnummern);

    const bisherige = hausnummern.get(p.hausnummer);
    if (bisherige === undefined || (istUnbuchstabiert && !bisherige.istUnbuchstabiert)) {
      hausnummern.set(p.hausnummer, { wk, istUnbuchstabiert });
    }
  }

  const ergebnis = new Map<string, Map<number, string>>();
  for (const [strasse, hausnummern] of byStrasse) {
    const flach = new Map<number, string>();
    for (const [hnr, eintrag] of hausnummern) flach.set(hnr, eintrag.wk);
    ergebnis.set(strasse, flach);
  }
  return { byStrasse: ergebnis, ohneTreffer, mehrdeutig };
}

async function main(): Promise<void> {
  console.log("Lade Bielefelder Landtagswahlkreis-Polygone ...");
  const polygone = await ladeWahlkreisPolygone();
  console.log(`  ${polygone.length} Polygone geladen.`);

  console.log("Lade Bielefelder Adresspunkte ...");
  const punkte = await ladeAdresspunkte();
  console.log(`  ${punkte.length} Adresspunkte geladen.`);

  const { byStrasse, ohneTreffer, mehrdeutig } = baueHausnummernProStrasse(punkte, polygone);

  const strassen: Strasse[] = [];
  for (const [name, hausnummern] of byStrasse) {
    const rohZeilen: RohZeile[] = [...hausnummern.entries()].map(([hnr, wk]) => ({
      von: hnr,
      bis: hnr,
      par: hnr % 2 === 0 ? "g" : "u",
      wk,
    }));
    strassen.push(gruppiereZuStrasse(name, rohZeilen));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));
  await ergaenzeBuchstabenAusnahmen("Bielefeld", buchstabenAdressen, strassen);

  checkWahlkreisCount(BIELEFELD_WAHLKREISE, 3);

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
      kommune: "Bielefeld",
      stand: BIELEFELD_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [BIELEFELD_LWK_URL, BIELEFELD_ADRESSEN_URL],
      // Adresse -> Landtagswahlkreis per Punkt-in-Polygon-Abgleich zwischen
      // amtlichen Hauskoordinaten und den amtlichen Landtagswahlkreis-
      // Polygonen (siehe src/build/geo.ts) - kein Zwischenschritt über
      // Kommunalwahlbezirke nötig, da die Wahlkreisgrenze selbst als
      // Geodatensatz vorliegt.
      zuordnung: "berechnet",
    },
    wahlkreise: BIELEFELD_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Adresspunkte: ${punkte.length}`);
  console.log(`  ohne Treffer (außerhalb aller Polygone): ${ohneTreffer}`);
  console.log(`  mehrdeutig (mehrere Polygone): ${mehrdeutig}`);
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
