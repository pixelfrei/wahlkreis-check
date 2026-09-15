import { buchstabenGrenzen, zusatzVon } from "../buchstabenPruefung.js";
import { hatBuchstabenzusatz, parseHausnummer } from "../parse.js";
import { BuildError, type RohZeile } from "../gruppierung.js";
import { wahlkreisFuer } from "./wahlkreis.js";

export interface HammZeile {
  strasse: string;
  stadtbezirk: string;
  ungeradeVon: string | null;
  ungeradeBis: string | null;
  geradeVon: string | null;
  geradeBis: string | null;
}

/**
 * pdf-parse extrahiert Hamms Tabelle als tab-getrennten Text. Normalerweise
 * ergeben sich 7 Felder (Kommunalwahlbezirk, Straße, uVon, uBis, gVon, gBis,
 * Stadtbezirk), 5 (nur eine Parität), oder 3 (ganz ohne Hausnummern). Bei
 * einigen Zeilen fehlt aber ein Tab, weil Straßenname und erste Hausnummer
 * bzw. ein Buchstabenzusatz und die nächste Zahl im PDF ohne Lücke
 * aneinanderstoßen - das ergibt dann 6 statt 7 Felder. Beide Fälle sind im
 * echten Datensatz eindeutig unterscheidbar (siehe parse.test.ts).
 */
export function rekonstruiereFelder(rawFields: string[]): string[] {
  if (rawFields.length !== 6) return rawFields;

  for (let i = 2; i <= 4; i++) {
    const m = /^(\d+\s+[a-z])\s+(\d+)$/.exec(rawFields[i]!.trim());
    if (m) {
      return [...rawFields.slice(0, i), m[1]!, m[2]!, ...rawFields.slice(i + 1)];
    }
  }

  const nameFusion = /^(.+\S)\s+(\d+)$/.exec(rawFields[1]!.trim());
  if (nameFusion) {
    return [rawFields[0]!, nameFusion[1]!, nameFusion[2]!, ...rawFields.slice(2)];
  }

  throw new BuildError(`Zeile mit 6 Feldern nicht auflösbar: ${rawFields.join(" | ")}`);
}

/**
 * Baut aus einer (bereits rekonstruierten) Feldliste eine HammZeile. Bei nur
 * einer Parität (5 Felder) verrät die Parität der Zahlen selbst, ob es sich um
 * die ungerade oder gerade Spalte handelt - im PDF sind die beiden Spalten
 * strikt getrennt (Kopfzeile "ungerade Hausnummern" / "gerade Hausnummern").
 */
export function parseZeile(rawFields: string[]): HammZeile {
  const fields = rekonstruiereFelder(rawFields).map((f) => f.trim());

  if (fields.length === 7) {
    const [, strasse, uVon, uBis, gVon, gBis, stadtbezirk] = fields;
    return {
      strasse: strasse!,
      stadtbezirk: stadtbezirk!,
      ungeradeVon: uVon || null,
      ungeradeBis: uBis || null,
      geradeVon: gVon || null,
      geradeBis: gBis || null,
    };
  }

  if (fields.length === 5) {
    const [, strasse, von, bis, stadtbezirk] = fields;
    const geradeVon = parseHausnummer(von!) % 2 === 0;
    const geradeBis = parseHausnummer(bis!) % 2 === 0;
    if (geradeVon !== geradeBis) {
      throw new BuildError(
        `Straße "${strasse}": Von (${von}) und Bis (${bis}) einer Einzelspalte haben unterschiedliche Parität.`,
      );
    }
    return {
      strasse: strasse!,
      stadtbezirk: stadtbezirk!,
      ungeradeVon: geradeVon ? null : von!,
      ungeradeBis: geradeVon ? null : bis!,
      geradeVon: geradeVon ? von! : null,
      geradeBis: geradeVon ? bis! : null,
    };
  }

  if (fields.length === 3) {
    const [, strasse, stadtbezirk] = fields;
    return {
      strasse: strasse!,
      stadtbezirk: stadtbezirk!,
      ungeradeVon: null,
      ungeradeBis: null,
      geradeVon: null,
      geradeBis: null,
    };
  }

  throw new BuildError(`Unerwartete Feldanzahl (${fields.length}): ${fields.join(" | ")}`);
}

/**
 * Hamms PDF trägt Basisnummer und Buchstabenzusatz kombiniert in einem Feld
 * (z.B. "53 a"), genau wie Dortmund/Köln - anders als die getrennten Spalten
 * bei Düsseldorf. Die Regel bleibt dieselbe: ein Zusatz an der unteren Grenze
 * bedeutet, die Basisnummer gehört noch zum vorherigen Bereich.
 */
export function hammZeileZuRohZeilen(zeile: HammZeile): RohZeile[] {
  const wk = wahlkreisFuer(zeile.stadtbezirk);
  const ergebnisse: RohZeile[] = [];

  if (zeile.ungeradeVon !== null && zeile.ungeradeBis !== null) {
    const vonBasis = parseHausnummer(zeile.ungeradeVon);
    const von = hatBuchstabenzusatz(zeile.ungeradeVon) ? vonBasis + 1 : vonBasis;
    const bis = parseHausnummer(zeile.ungeradeBis);
    const buchstaben = buchstabenGrenzen(
      { nummer: vonBasis, zusatz: zusatzVon(zeile.ungeradeVon) },
      { nummer: bis, zusatz: zusatzVon(zeile.ungeradeBis) },
      vonBasis !== bis,
    );
    ergebnisse.push({ von, bis, par: "u", wk: wk, ...(buchstaben && { buchstaben }) });
  }

  if (zeile.geradeVon !== null && zeile.geradeBis !== null) {
    const vonBasis = parseHausnummer(zeile.geradeVon);
    const von = hatBuchstabenzusatz(zeile.geradeVon) ? vonBasis + 1 : vonBasis;
    const bis = parseHausnummer(zeile.geradeBis);
    const buchstaben = buchstabenGrenzen(
      { nummer: vonBasis, zusatz: zusatzVon(zeile.geradeVon) },
      { nummer: bis, zusatz: zusatzVon(zeile.geradeBis) },
      vonBasis !== bis,
    );
    ergebnisse.push({ von, bis, par: "g", wk: wk, ...(buchstaben && { buchstaben }) });
  }

  if (ergebnisse.length === 0) {
    // Zeile ohne Hausnummern - dieser Straßenabschnitt hat keine nummerierten
    // Adressen (siehe entferneUeberfluessigeAdresslose/istUnaufloesbarAdresslos
    // in gruppierung.ts, die das für Hamm genau wie für Düsseldorf auflösen).
    ergebnisse.push({ von: null, bis: null, par: null, wk });
  }

  return ergebnisse;
}
