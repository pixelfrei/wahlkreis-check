import { mkdir, writeFile } from "node:fs/promises";
import { ergebnisFuer } from "../frontend/lookup.js";
import type { Strasse } from "../shared/types.js";
import type { RohZeile } from "./gruppierung.js";

/** Eine Hausnummer mit Buchstabenzusatz, wie sie in den Quelldaten vorkommt. */
export interface Buchstabe {
  nummer: number;
  zusatz: string;
}

export interface BuchstabenAdresse extends Buchstabe {
  strasse: string;
  /** Wahlkreis laut Quelle */
  wk: string;
}

export interface BuchstabenBefund extends BuchstabenAdresse {
  /** Wahlkreis, den die App für die Eingabe "<nummer><zusatz>" anzeigt (null = kein Treffer) */
  app: string | null;
}

export interface BuchstabenBericht {
  kommune: string;
  geprueft: number;
  falsch: BuchstabenBefund[];
  keinTreffer: BuchstabenBefund[];
  strasseNichtGefunden: number;
}

/** Buchstabenzusatz einer Hausnummer wie "15b", "015 B" oder "94A" - "" wenn keiner. */
export function zusatzVon(hausnummer: string): string {
  return /^\s*\d+\s*([a-zA-Z]+)/.exec(hausnummer)?.[1]?.toLowerCase() ?? "";
}

/** Die Buchstaben-Grenzen eines Bereichs (untere und/oder obere Grenze mit Zusatz). */
export function buchstabenGrenzen(
  von: { nummer: number; zusatz: string | undefined | null } | null,
  bis: { nummer: number; zusatz: string | undefined | null } | null,
): Buchstabe[] | undefined {
  const liste: Buchstabe[] = [];
  for (const grenze of [von, bis]) {
    if (grenze?.zusatz) liste.push({ nummer: grenze.nummer, zusatz: grenze.zusatz.toLowerCase() });
  }
  return liste.length > 0 ? liste : undefined;
}

/** Sammelt die Buchstaben-Grenzen aller Zeilen, gruppiert nach Straßenname. */
export function buchstabenAusZeilen(byStrasse: Map<string, RohZeile[]>): BuchstabenAdresse[] {
  const adressen: BuchstabenAdresse[] = [];
  for (const [strasse, zeilen] of byStrasse) {
    for (const zeile of zeilen) {
      if (zeile.wk === null) continue;
      for (const b of zeile.buchstaben ?? []) adressen.push({ strasse, wk: zeile.wk, ...b });
    }
  }
  return adressen;
}

/**
 * Prüft, welchen Wahlkreis die App für Hausnummern mit Buchstabenzusatz
 * anzeigt. Die App wertet nur die Nummer aus ("15b" wie "15") - liegen "15"
 * und "15b" in unterschiedlichen Wahlkreisen, ist das Ergebnis falsch.
 */
export function pruefeBuchstaben(
  kommune: string,
  adressen: BuchstabenAdresse[],
  strassen: Strasse[],
): BuchstabenBericht {
  const nachName = new Map(strassen.map((s) => [s.n, s]));
  const gesehen = new Set<string>();
  const bericht: BuchstabenBericht = {
    kommune,
    geprueft: 0,
    falsch: [],
    keinTreffer: [],
    strasseNichtGefunden: 0,
  };

  for (const a of adressen) {
    const schluessel = `${a.strasse}|${a.nummer}|${a.zusatz}|${a.wk}`;
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);

    const strasse = nachName.get(a.strasse);
    if (!strasse) {
      bericht.strasseNichtGefunden++;
      continue;
    }
    bericht.geprueft++;
    const ergebnis = ergebnisFuer(strasse, a.nummer);
    const app = ergebnis.art === "treffer" || ergebnis.art === "eindeutig" ? ergebnis.wk : null;
    if (app === null) bericht.keinTreffer.push({ ...a, app });
    else if (app !== a.wk) bericht.falsch.push({ ...a, app });
  }
  return bericht;
}

/**
 * Gibt den Bericht aus. Ist BUCHSTABEN_BERICHT_DIR gesetzt, landet er zusätzlich
 * als JSON-Datei dort (für eine Auswertung über alle Städte).
 */
export async function berichteBuchstaben(
  kommune: string,
  adressen: BuchstabenAdresse[],
  strassen: Strasse[],
): Promise<BuchstabenBericht> {
  const bericht = pruefeBuchstaben(kommune, adressen, strassen);
  console.log(
    `Buchstabenzusätze: ${bericht.geprueft} geprüft, ${bericht.falsch.length} mit falschem Wahlkreis, ` +
      `${bericht.keinTreffer.length} ohne Treffer` +
      (bericht.strasseNichtGefunden > 0 ? `, ${bericht.strasseNichtGefunden} Straße nicht gefunden` : ""),
  );
  for (const f of bericht.falsch) {
    console.log(`  falsch: ${f.strasse} ${f.nummer}${f.zusatz} -> richtig ${f.wk}, App ${f.app}`);
  }

  const verzeichnis = process.env.BUCHSTABEN_BERICHT_DIR;
  if (verzeichnis) {
    await mkdir(verzeichnis, { recursive: true });
    const datei = kommune.toLowerCase().replace(/[^a-z0-9äöüß]+/g, "-");
    await writeFile(`${verzeichnis}/${datei}.json`, `${JSON.stringify(bericht, null, 2)}\n`, "utf-8");
  }
  return bericht;
}
