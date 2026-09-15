import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: von der Stadt Hamm geht
 * nur der Stadtbezirk Herringen an Wahlkreis 117 (gemeinsam mit Teilen des
 * Kreises Unna). Alle übrigen sechs Stadtbezirke bilden Wahlkreis 118 (Hamm I).
 */
const STADTBEZIRK_ZU_WK: Record<string, string> = {
  Herringen: "117",
  Mitte: "118",
  Uentrop: "118",
  Rhynern: "118",
  Pelkum: "118",
  "Bockum-Hövel": "118",
  Heessen: "118",
};

export function wahlkreisFuer(stadtbezirk: string): string {
  const wk = STADTBEZIRK_ZU_WK[stadtbezirk];
  if (!wk) {
    throw new BuildError(`Unbekannter Stadtbezirk "${stadtbezirk}".`);
  }
  return wk;
}
