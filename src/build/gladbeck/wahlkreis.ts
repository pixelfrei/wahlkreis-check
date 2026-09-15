import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: von der Gemeinde
 * Gladbeck gehen die Stadtbezirke Rentfort-Nord, Schultendorf, Alt-Rentfort
 * und Ellinghorst an Wahlkreis 75 ("Bottrop - Recklinghausen VI"). Die
 * übrigen Stadtbezirke (Mitte I, Mitte II, Zweckel, Butendorf, Brauck,
 * Rosenhügel) bilden Wahlkreis 73 ("Gelsenkirchen I - Recklinghausen V").
 *
 * Das amtliche Kommunalwahlbezirks-Verzeichnis (siehe config.ts) nennt keine
 * Kommunalwahlbezirke mit dem Namen "Mitte II" - alle Kommunalwahlbezirke
 * 1-5 heißen dort "Mitte I". Das ist für die Wahlkreis-Zuordnung unerheblich,
 * da sowohl Mitte I als auch Mitte II vollständig zu Wahlkreis 73 gehören.
 */
const WK75_KOMMUNALWAHLBEZIRKE = new Set(["10", "11", "12", "13", "14"]);
const GUELTIGE_KOMMUNALWAHLBEZIRKE = new Set(
  Array.from({ length: 22 }, (_, i) => String(i + 1)),
);

export function wahlkreisFuer(kommunalwahlbezirk: string): string {
  if (!GUELTIGE_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) {
    throw new BuildError(`Unbekannter Kommunalwahlbezirk "${kommunalwahlbezirk}".`);
  }
  return WK75_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk) ? "75" : "73";
}
