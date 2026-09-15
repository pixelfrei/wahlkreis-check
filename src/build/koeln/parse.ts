import type { RohZeile } from "../gruppierung.js";
import { hatBuchstabenzusatz, parseHausnummer } from "../parse.js";

export interface KoelnZeile {
  strasse: string;
  landtag: string;
  ungeradeVon: string | null;
  ungeradeBis: string | null;
  geradeVon: string | null;
  geradeBis: string | null;
}

/**
 * Eine Zeile aus dem Kölner Straßenverzeichnis trägt ungerade und/oder gerade
 * Hausnummernbereiche direkt nebeneinander, je mit demselben Landtagswahlkreis.
 * Buchstabenzusatz an der unteren Grenze wird genauso behandelt wie in Dortmund
 * (siehe src/build/parse.ts): die Basisnummer gehört zum vorherigen Bereich.
 */
export function koelnZeileZuRohZeilen(zeile: KoelnZeile): RohZeile[] {
  const ergebnisse: RohZeile[] = [];

  if (zeile.ungeradeVon !== null && zeile.ungeradeBis !== null) {
    const vonBasis = parseHausnummer(zeile.ungeradeVon);
    const von = hatBuchstabenzusatz(zeile.ungeradeVon) ? vonBasis + 1 : vonBasis;
    ergebnisse.push({ von, bis: parseHausnummer(zeile.ungeradeBis), par: "u", wk: zeile.landtag });
  }

  if (zeile.geradeVon !== null && zeile.geradeBis !== null) {
    const vonBasis = parseHausnummer(zeile.geradeVon);
    const von = hatBuchstabenzusatz(zeile.geradeVon) ? vonBasis + 1 : vonBasis;
    ergebnisse.push({ von, bis: parseHausnummer(zeile.geradeBis), par: "g", wk: zeile.landtag });
  }

  return ergebnisse;
}
