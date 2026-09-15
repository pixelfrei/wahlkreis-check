import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: von Jüchen gehen die
 * Kommunalwahlbezirke 14.1 bis 17.1 an Wahlkreis 46 ("Rhein-Kreis Neuss II"),
 * die Kommunalwahlbezirke 1.1 bis 13.1 sowie 18.1 und 19.1 an Wahlkreis 47
 * ("Rhein-Kreis Neuss III"). Der Vote-Manager-Datensatz führt die
 * Kommunalwahlbezirk-Nummer mal zehn, vierstellig mit führenden Nullen (z.B.
 * "0151" für Kommunalwahlbezirk 15.1); die letzte Ziffer unterscheidet
 * Stimmbezirke innerhalb desselben Kommunalwahlbezirks (meist 1, bei
 * größeren Bezirken auch 2).
 */
const WK46_KOMMUNALWAHLBEZIRKE = new Set([14, 15, 16, 17]);

export function wahlkreisFuer(bezirkNr: string): string {
  const nr = parseInt(bezirkNr, 10);
  const kommunalwahlbezirk = Math.floor(nr / 10);
  if (Number.isNaN(kommunalwahlbezirk) || kommunalwahlbezirk < 1 || kommunalwahlbezirk > 19) {
    throw new BuildError(`Unbekannter Kommunalwahlbezirk "${kommunalwahlbezirk}" (aus Bezirk-Nr "${bezirkNr}").`);
  }
  return WK46_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk) ? "46" : "47";
}
