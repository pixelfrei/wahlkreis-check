import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: die Stadtbezirke 1
 * (West), 5 (Süd), 6 (Fischeln) und 7 (Oppum-Linn) gehen an Wahlkreis 48
 * ("Krefeld I - Viersen III"), die Stadtbezirke 2 (Nord), 3 (Hüls), 4
 * (Mitte), 8 (Ost) und 9 (Uerdingen) bilden Wahlkreis 49 ("Krefeld II"). Die
 * Stadtbezirk-Nummern selbst sind seit Jahrzehnten stabil - nur die
 * Landtagswahlkreis-Nummern haben sich durch die Wahlkreisreform 2021
 * geändert (früher 47/48, siehe Quelle in config.ts).
 */
const WK48_STADTBEZIRKE = new Set([1, 5, 6, 7]);
const WK49_STADTBEZIRKE = new Set([2, 3, 4, 8, 9]);

export function wahlkreisFuer(stadtbezirk: string): string {
  const nr = parseInt(stadtbezirk, 10);

  if (WK48_STADTBEZIRKE.has(nr)) return "48";
  if (WK49_STADTBEZIRKE.has(nr)) return "49";

  throw new BuildError(`Unbekannter Stadtbezirk "${stadtbezirk}".`);
}
