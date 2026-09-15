import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Wahlkreis 37
 * ("Mettmann I") umfasst von Hilden die Kommunalwahlbezirke 3010 bis 3050
 * und 3070 bis 3100. Wahlkreis 38 ("Mettmann II") umfasst 3060 sowie 3110
 * bis 3220.
 *
 * Die Anlage nennt den oberen Bereich als "3110 bis 3220" - nach der
 * Kommunalwahl-2025-Neueinteilung (Ratsbeschluss vom 12.12.2023, Reduktion
 * auf 40 Ratsmitglieder / 20 Wahlbezirke) existieren tatsächlich nur noch
 * die Wahlbezirke 3110 bis 3200 (kein 3210/3220 mehr) - das ist nur eine
 * Verkleinerung der Menge innerhalb des in der Anlage genannten Bereichs,
 * keine Änderung der Regel selbst.
 */
export function wahlkreisFuerWahlbezirk(wahlbezirk: number): string {
  if (wahlbezirk === 3060) return "38";
  if (wahlbezirk >= 3010 && wahlbezirk <= 3100) return "37";
  if (wahlbezirk >= 3110 && wahlbezirk <= 3220) return "38";
  throw new BuildError(`Unbekannter Wahlbezirk "${wahlbezirk}".`);
}
