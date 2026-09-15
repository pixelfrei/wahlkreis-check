import { mkdir, writeFile } from "node:fs/promises";
import { ergebnisFuer } from "../frontend/lookup.js";
import type { BuchstabenAusnahme, Strasse } from "../shared/types.js";
import { BuildError, type RohZeile } from "./gruppierung.js";

/** Eine Hausnummer mit Buchstabenzusatz, wie sie in den Quelldaten vorkommt. */
export interface Buchstabe {
  nummer: number;
  zusatz: string;
  /**
   * Untere Grenze eines Bereichs ("15b-19"): gilt für diesen und alle
   * folgenden Buchstaben derselben Nummer, nicht nur für "15b" selbst.
   */
  ab?: boolean;
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

/**
 * Die Buchstaben-Grenzen eines Eintrags. `istBereich`: der Eintrag ist ein
 * Bereich (dann gilt ein Zusatz an der unteren Grenze "ab" diesem Buchstaben),
 * sonst eine einzelne Hausnummer.
 */
export function buchstabenGrenzen(
  von: { nummer: number; zusatz: string | undefined | null } | null,
  bis: { nummer: number; zusatz: string | undefined | null } | null,
  istBereich: boolean,
): Buchstabe[] | undefined {
  const liste: Buchstabe[] = [];
  if (von?.zusatz) {
    liste.push({
      nummer: von.nummer,
      zusatz: von.zusatz.toLowerCase(),
      ...(istBereich && { ab: true }),
    });
  }
  if (bis?.zusatz) liste.push({ nummer: bis.nummer, zusatz: bis.zusatz.toLowerCase() });
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

/** Prüft, welchen Wahlkreis die App für die Hausnummern mit Buchstabenzusatz anzeigt. */
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
    const schluessel = `${a.strasse}|${a.nummer}|${a.zusatz}|${a.wk}|${a.ab ?? false}`;
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);

    const strasse = nachName.get(a.strasse);
    if (!strasse) {
      bericht.strasseNichtGefunden++;
      continue;
    }
    bericht.geprueft++;
    const ergebnis = ergebnisFuer(strasse, a.nummer, a.zusatz);
    const app = ergebnis.art === "treffer" || ergebnis.art === "eindeutig" ? ergebnis.wk : null;
    if (app === null) bericht.keinTreffer.push({ ...a, app });
    else if (app !== a.wk) bericht.falsch.push({ ...a, app });
  }
  return bericht;
}

function ausnahmeAus(a: BuchstabenAdresse, ab: boolean): BuchstabenAusnahme {
  return { nr: a.nummer, von: a.zusatz, bis: ab ? "z" : a.zusatz, wk: a.wk };
}

function fuegeHinzu(strasse: Strasse, ausnahme: BuchstabenAusnahme): void {
  const liste = (strasse.z ??= []);
  const doppelt = liste.some(
    (x) => x.nr === ausnahme.nr && x.von === ausnahme.von && x.bis === ausnahme.bis,
  );
  if (!doppelt) liste.push(ausnahme);
}

/** Fasst einzelne Ausnahmen mit aufeinanderfolgenden Buchstaben zusammen (5b, 5c, 5d -> 5b-5d). */
function fasseZusammen(liste: BuchstabenAusnahme[]): BuchstabenAusnahme[] {
  const sortiert = [...liste].sort((a, b) => a.nr - b.nr || a.von.localeCompare(b.von));
  const ergebnis: BuchstabenAusnahme[] = [];
  for (const a of sortiert) {
    const letzte = ergebnis[ergebnis.length - 1];
    const einzeln = (x: BuchstabenAusnahme) => x.von === x.bis && x.von.length === 1;
    if (
      letzte &&
      einzeln(a) &&
      letzte.bis.length === 1 &&
      letzte.bis !== "z" &&
      letzte.nr === a.nr &&
      letzte.wk === a.wk &&
      a.von.charCodeAt(0) === letzte.bis.charCodeAt(0) + 1
    ) {
      letzte.bis = a.bis;
    } else {
      ergebnis.push({ ...a });
    }
  }
  return ergebnis;
}

function beschreibe(f: BuchstabenBefund): string {
  return `${f.strasse} ${f.nummer}${f.zusatz} -> richtig ${f.wk}, App ${f.app ?? "kein Treffer"}`;
}

/**
 * Die App wertet bei einer Hausnummer wie "15b" zuerst die Buchstaben-Ausnahmen
 * der Straße aus, sonst nur die Nummer. Liegen "15" und "15b" laut Quelle in
 * unterschiedlichen Wahlkreisen (oder gibt es "15" gar nicht), ergänzt diese
 * Funktion eine Ausnahme an der Straße - und prüft danach alle Hausnummern mit
 * Buchstaben erneut. Bleibt eine falsch, bricht der Build ab.
 *
 * Ist BUCHSTABEN_BERICHT_DIR gesetzt, landet der Bericht zusätzlich als JSON dort.
 */
export async function ergaenzeBuchstabenAusnahmen(
  kommune: string,
  adressen: BuchstabenAdresse[],
  strassen: Strasse[],
): Promise<BuchstabenBericht> {
  const nachName = new Map(strassen.map((s) => [s.n, s]));
  const vorher = pruefeBuchstaben(kommune, adressen, strassen);

  // 1. Für jede falsche Adresse eine Ausnahme - bei Bereichsgrenzen "ab" dem Buchstaben.
  for (const f of [...vorher.falsch, ...vorher.keinTreffer]) {
    fuegeHinzu(nachName.get(f.strasse)!, ausnahmeAus(f, f.ab ?? false));
  }
  // 2. Hat eine "ab"-Ausnahme dabei Buchstaben erfasst, die woanders liegen,
  //    bekommen diese eine eigene, engere Ausnahme.
  const zwischen = pruefeBuchstaben(kommune, adressen, strassen);
  for (const f of [...zwischen.falsch, ...zwischen.keinTreffer]) {
    fuegeHinzu(nachName.get(f.strasse)!, ausnahmeAus(f, false));
  }
  // 3. Einzelne Buchstaben zusammenfassen - nur wenn das nichts verändert.
  for (const s of strassen) {
    if (!s.z) continue;
    const einzeln = s.z;
    s.z = fasseZusammen(einzeln);
    const test = pruefeBuchstaben(kommune, adressen, [s]);
    if (test.falsch.length > 0 || test.keinTreffer.length > 0) s.z = einzeln;
  }

  const nachher = pruefeBuchstaben(kommune, adressen, strassen);
  const anzahlAusnahmen = strassen.reduce((n, s) => n + (s.z?.length ?? 0), 0);
  console.log(
    `Buchstabenzusätze: ${vorher.geprueft} geprüft, ${vorher.falsch.length} mit falschem Wahlkreis und ` +
      `${vorher.keinTreffer.length} ohne Treffer -> ${anzahlAusnahmen} Ausnahmen an ` +
      `${strassen.filter((s) => s.z).length} Straßen ergänzt`,
  );
  for (const f of vorher.falsch) console.log(`  ${beschreibe(f)}`);

  const verzeichnis = process.env.BUCHSTABEN_BERICHT_DIR;
  if (verzeichnis) {
    await mkdir(verzeichnis, { recursive: true });
    const datei = kommune.toLowerCase().replace(/[^a-z0-9äöüß]+/g, "-");
    await writeFile(
      `${verzeichnis}/${datei}.json`,
      `${JSON.stringify({ vorher, nachher, anzahlAusnahmen }, null, 2)}\n`,
      "utf-8",
    );
  }

  const offen = [...nachher.falsch, ...nachher.keinTreffer];
  if (offen.length > 0) {
    for (const f of offen) console.error(`  weiterhin falsch: ${beschreibe(f)}`);
    throw new BuildError(
      `${offen.length} Hausnummern mit Buchstabenzusatz lassen sich nicht eindeutig zuordnen ` +
        `(widersprüchliche Quelldaten?).`,
    );
  }
  return nachher;
}
