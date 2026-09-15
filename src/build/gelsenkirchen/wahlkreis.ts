import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: die Stadtbezirke 2
 * (Gelsenkirchen-Nord) und 3 (Gelsenkirchen-West) gehen an Wahlkreis 73
 * ("Gelsenkirchen I - Recklinghausen V"), die Stadtbezirke 1
 * (Gelsenkirchen-Mitte), 4 (Gelsenkirchen-Ost) und 5 (Gelsenkirchen-Süd)
 * bilden Wahlkreis 74 ("Gelsenkirchen II").
 */
const WK73_STADTBEZIRKE = new Set([2, 3]);
const WK74_STADTBEZIRKE = new Set([1, 4, 5]);

export function wahlkreisFuer(bezirkNr: string): string {
  const stadtbezirk = parseInt(bezirkNr[0] ?? "", 10);

  if (WK73_STADTBEZIRKE.has(stadtbezirk)) return "73";
  if (WK74_STADTBEZIRKE.has(stadtbezirk)) return "74";

  throw new BuildError(`Unbekannter Stadtbezirk "${stadtbezirk}" (aus Bezirk-Nr "${bezirkNr}").`);
}
