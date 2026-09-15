import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Münsters
 * Kommunalwahlbezirke 03, 05, 06, 14-19, 31-33 bilden Wahlkreis 83, die
 * Kommunalwahlbezirke 04, 07-10, 20-26 Wahlkreis 84, die Kommunalwahlbezirke
 * 01, 02, 11-13, 27-30 Wahlkreis 85.
 */
const WK83_KOMMUNALWAHLBEZIRKE = new Set([3, 5, 6, 14, 15, 16, 17, 18, 19, 31, 32, 33]);
const WK84_KOMMUNALWAHLBEZIRKE = new Set([4, 7, 8, 9, 10, 20, 21, 22, 23, 24, 25, 26]);
const WK85_KOMMUNALWAHLBEZIRKE = new Set([1, 2, 11, 12, 13, 27, 28, 29, 30]);

export function wahlkreisFuer(stimmbezirk: number): string {
  const kommunalwahlbezirk = Math.floor(stimmbezirk / 10);

  if (WK83_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) return "83";
  if (WK84_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) return "84";
  if (WK85_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) return "85";

  throw new BuildError(
    `Unbekannter Kommunalwahlbezirk "${kommunalwahlbezirk}" (aus Stimmbezirk "${stimmbezirk}").`,
  );
}
