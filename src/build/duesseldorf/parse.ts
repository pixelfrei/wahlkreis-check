import { buchstabenGrenzen } from "../buchstabenPruefung.js";
import type { RohZeile } from "../gruppierung.js";
import { wahlkreisFuer } from "./wahlkreis.js";

export interface DuesseldorfZeile {
  strasse: string;
  stadtbezirk: string;
  stadtteilname: string;
  ungeradeVon: string | null;
  ungeradeVonZus: string;
  ungeradeBis: string | null;
  geradeVon: string | null;
  geradeVonZus: string;
  geradeBis: string | null;
}

/**
 * Anders als Köln/Dortmund liefert Düsseldorf Basisnummer und Buchstabenzusatz in
 * getrennten Spalten. Die Regel bleibt dieselbe: ein Zusatz an der unteren Grenze
 * bedeutet, die Basisnummer gehört noch zum vorherigen Bereich (siehe
 * src/build/parse.ts für die Dortmund/Köln-Variante mit kombinierten Strings).
 */
export function duesseldorfZeileZuRohZeilen(zeile: DuesseldorfZeile): RohZeile[] {
  const wk = wahlkreisFuer(zeile.stadtbezirk, zeile.stadtteilname);
  const ergebnisse: RohZeile[] = [];

  if (zeile.ungeradeVon !== null && zeile.ungeradeBis !== null) {
    const vonBasis = parseInt(zeile.ungeradeVon, 10);
    const von = zeile.ungeradeVonZus ? vonBasis + 1 : vonBasis;
    const buchstaben = buchstabenGrenzen({ nummer: vonBasis, zusatz: zeile.ungeradeVonZus }, null);
    ergebnisse.push({ von, bis: parseInt(zeile.ungeradeBis, 10), par: "u", wk, ...(buchstaben && { buchstaben }) });
  }

  if (zeile.geradeVon !== null && zeile.geradeBis !== null) {
    const vonBasis = parseInt(zeile.geradeVon, 10);
    const von = zeile.geradeVonZus ? vonBasis + 1 : vonBasis;
    const buchstaben = buchstabenGrenzen({ nummer: vonBasis, zusatz: zeile.geradeVonZus }, null);
    ergebnisse.push({ von, bis: parseInt(zeile.geradeBis, 10), par: "g", wk, ...(buchstaben && { buchstaben }) });
  }

  if (ergebnisse.length === 0) {
    // Zeile ohne Hausnummern (z.B. ein Platz) - die ganze Straße liegt in diesem Wahlkreis.
    ergebnisse.push({ von: null, bis: null, par: null, wk });
  }

  return ergebnisse;
}
