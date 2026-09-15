import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Wahlkreis 25
 * ("Rhein-Sieg-Kreis I") umfasst von Hennef (Sieg) die Stimmbezirke 011,
 * 012, 021, 022, 031, 032, 041, 042, 050, 061, 062, 070, 080, 090, 100,
 * 111, 121, 122, 141, 142, 151, 152, 161, 162, 181, 182, 191, 192 und (laut
 * Anlage-Text) "202". Wahlkreis 26 ("Rhein-Sieg-Kreis II") umfasst die
 * Stimmbezirke 112, 131, 132 und 170.
 *
 * KORREKTUR: Die Anlage nennt für Wahlkreis 25 den Stimmbezirk "202" - den
 * gibt es bei Hennef aber gar nicht. Sowohl das 2021er-Straßenverzeichnis
 * als auch die Ergebnis-API der aktuellen Kommunalwahl-2025-Präsentation
 * (amtliche, aktuelle Stimmbezirksliste) verzeichnen stattdessen "200 -
 * Bödingen, Lauthausen/Oberauel" - mit exakt 33 Stimmbezirken insgesamt
 * (011-200), keinem "202". Das ist offensichtlich ein Zahlendreher in der
 * Anlage (0↔2), kein echter Umbenennungs-/Neuzuschnitt-Fall: verwendet wird
 * daher "200" statt "202".
 */
const WK26_STIMMBEZIRKE = new Set([112, 131, 132, 170]);
const HENNEF_STIMMBEZIRKE = new Set([
  11, 12, 21, 22, 31, 32, 41, 42, 50, 61, 62, 70, 80, 90, 100, 111, 112, 121, 122, 131, 132, 141,
  142, 151, 152, 161, 162, 170, 181, 182, 191, 192, 200,
]);

export function wahlkreisFuer(bezirkNr: number): string {
  if (!HENNEF_STIMMBEZIRKE.has(bezirkNr)) {
    throw new BuildError(`Unbekannter Stimmbezirk "${bezirkNr}".`);
  }

  return WK26_STIMMBEZIRKE.has(bezirkNr) ? "26" : "25";
}
