import { BuildError } from "../gruppierung.js";

/**
 * Essens 50 amtliche Stadtteile (Quelle: Stadt Essen / "Liste der
 * Stadtbezirke und Stadtteile von Essen"), gruppiert nach den 9
 * Stadtbezirken (römisch I-IX), und daraus abgeleitet nach Wahlkreis gemäß
 * der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW:
 *
 * - WK65 ("Essen I"): die kompletten Stadtbezirke IV (Borbeck) und
 *   V (Altenessen/Karnap/Vogelheim).
 * - WK66 ("Essen II"): die kompletten Stadtbezirke VI (Zollverein) und
 *   VII (Steele/Kray), plus aus Stadtbezirk I (Stadtmitte/Frillendorf) die
 *   Stadtteile 6 Südostviertel, 11 Huttrop, 36 Frillendorf.
 * - WK67 ("Essen III"): der komplette Stadtbezirk III (Essen-West), plus aus
 *   Stadtbezirk I die Stadtteile 1-5 (Stadtkern/Ost-/Nord-/West-/Südviertel),
 *   plus aus Stadtbezirk II (Rüttenscheid/Bergerhausen) der Stadtteil
 *   10 Rüttenscheid.
 * - WK68 ("Essen IV"): die kompletten Stadtbezirke VIII (Essen-Ruhrhalbinsel)
 *   und IX (Werden/Kettwig/Bredeney), plus aus Stadtbezirk II die Stadtteile
 *   12 Rellinghausen, 13 Bergerhausen, 14 Stadtwald.
 *
 * Alle 50 Stadtteile sind unten mit ihrer Stadtbezirk-Zugehörigkeit
 * aufgeführt (nicht nur die in der Anlage explizit genannten), damit jede
 * Stadtteil-Nummer aus dem Straßenverzeichnis eindeutig einem Wahlkreis
 * zugeordnet werden kann.
 */
const STADTTEIL_ZU_STADTBEZIRK: Record<number, string> = {
  1: "I", 2: "I", 3: "I", 4: "I", 5: "I", 6: "I", 11: "I", 36: "I",
  10: "II", 12: "II", 13: "II", 14: "II",
  7: "III", 8: "III", 9: "III", 15: "III", 28: "III", 41: "III",
  16: "IV", 17: "IV", 18: "IV", 19: "IV", 20: "IV", 21: "IV", 22: "IV", 23: "IV",
  24: "V", 25: "V", 40: "V", 50: "V",
  37: "VI", 38: "VI", 39: "VI",
  34: "VII", 35: "VII", 45: "VII", 46: "VII", 47: "VII",
  31: "VIII", 32: "VIII", 33: "VIII", 43: "VIII", 44: "VIII", 48: "VIII",
  26: "IX", 27: "IX", 29: "IX", 30: "IX", 42: "IX", 49: "IX",
};

const STADTBEZIRK_ZU_WK: Record<string, string> = {
  IV: "65",
  V: "65",
  VI: "66",
  VII: "66",
  III: "67",
  VIII: "68",
  IX: "68",
};

// Für die geteilten Stadtbezirke I und II reicht die Stadtbezirk-Zuordnung
// nicht - hier entscheidet die Anlage pro Stadtteil.
const GETEILTE_STADTTEILE_ZU_WK: Record<number, string> = {
  6: "66", 11: "66", 36: "66", // Stadtbezirk I -> Essen II
  1: "67", 2: "67", 3: "67", 4: "67", 5: "67", // Stadtbezirk I -> Essen III
  10: "67", // Stadtbezirk II -> Essen III
  12: "68", 13: "68", 14: "68", // Stadtbezirk II -> Essen IV
};

export function wahlkreisFuer(stadtteilNr: number): string {
  const geteilt = GETEILTE_STADTTEILE_ZU_WK[stadtteilNr];
  if (geteilt) return geteilt;

  const stadtbezirk = STADTTEIL_ZU_STADTBEZIRK[stadtteilNr];
  const wk = stadtbezirk ? STADTBEZIRK_ZU_WK[stadtbezirk] : undefined;
  if (!wk) {
    throw new BuildError(`Unbekannte Essener Stadtteil-Nummer "${stadtteilNr}".`);
  }
  return wk;
}
