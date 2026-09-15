import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Wahlkreis 71
 * ("Recklinghausen III") umfasst von Marl nur den Stadtteil 50 (Polsum),
 * Wahlkreis 70 ("Recklinghausen II") die übrigen neun Stadtteile (11
 * Stadtkern, 12 Alt-Marl, 13 Brassert, 14 Drewer-Nord, 15 Drewer-Süd, 21
 * Hüls-Nord, 22 Hüls-Süd, 30 Marl-Hamm, 40 Chemiezone, 60
 * Sinsen-Lenkerbeck).
 */
const WK70_STADTTEILE = new Set([11, 12, 13, 14, 15, 21, 22, 30, 40, 60]);

export function wahlkreisFuerStadtteil(stadttnr: number): string {
  if (stadttnr === 50) return "71";
  if (WK70_STADTTEILE.has(stadttnr)) return "70";
  throw new BuildError(`Unbekannter Stadtteil "${stadttnr}".`);
}
