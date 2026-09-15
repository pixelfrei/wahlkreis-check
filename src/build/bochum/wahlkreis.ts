import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Bochums 33
 * Kommunalwahlbezirke (10-18, 21-27, 31-33, 41-45, 51-54, 61-65) verteilen
 * sich auf drei Wahlkreise: 107 ("Bochum I": 10, 11, 17, 31-33, 41-45), 108
 * ("Bochum II": 13, 51-54, 61-65) und 109 ("Bochum III": 12, 14-16, 18,
 * 21-27). Amtlich bestätigt sowohl über die Anlage selbst als auch über die
 * vollständige Kommunalwahlbezirks-Liste der Stadt Bochum (Beschluss des
 * Wahlausschusses vom 23.10.2024).
 */
const WK107_KOMMUNALWAHLBEZIRKE = new Set([10, 11, 17, 31, 32, 33, 41, 42, 43, 44, 45]);
const WK108_KOMMUNALWAHLBEZIRKE = new Set([13, 51, 52, 53, 54, 61, 62, 63, 64, 65]);
const WK109_KOMMUNALWAHLBEZIRKE = new Set([12, 14, 15, 16, 18, 21, 22, 23, 24, 25, 26, 27]);

export function wahlkreisFuer(kwBezirk: number): string {
  if (WK107_KOMMUNALWAHLBEZIRKE.has(kwBezirk)) return "107";
  if (WK108_KOMMUNALWAHLBEZIRKE.has(kwBezirk)) return "108";
  if (WK109_KOMMUNALWAHLBEZIRKE.has(kwBezirk)) return "109";

  throw new BuildError(`Unbekannter Kommunalwahlbezirk "${kwBezirk}".`);
}
