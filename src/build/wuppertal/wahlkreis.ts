import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Wuppertal hat 10
 * Stadtbezirke (0 Elberfeld, 1 Elberfeld-West, 2 Uellendahl-Katernberg, 3
 * Vohwinkel, 4 Cronenberg, 5 Barmen, 6 Oberbarmen, 7 Heckinghausen, 8
 * Langerfeld-Beyenburg, 9 Ronsdorf). Acht davon gehen komplett an einen
 * Wahlkreis; nur die zwei größten - Elberfeld (0) und Barmen (5) - sind
 * selbst nach Kommunalwahlbezirk zwischen zwei Wahlkreisen aufgeteilt:
 *
 * Wahlkreis 32 ("Wuppertal I"): Barmen nur KWB 51 (Barmen-Mitte) und 53
 *   (Loh-Unterbarmen), dazu komplett Oberbarmen (6), Heckinghausen (7),
 *   Langerfeld-Beyenburg (8), Ronsdorf (9).
 * Wahlkreis 33 ("Wuppertal II"): Elberfeld nur KWB 01-05 (Elberfeld-Mitte,
 *   Hombüchel, Höchsten, Ostersbaum, Grifflenberg), Barmen nur KWB 52
 *   (Sedansberg-Rott), 54 (Clausen-Hatzfeld), 55 (Kothen-Lichtenplatz),
 *   dazu komplett Uellendahl-Katernberg (2).
 * Wahlkreis 34 ("Wuppertal III - Solingen II"): Elberfeld nur KWB 06
 *   (Friedrichsberg), dazu komplett Elberfeld-West (1), Vohwinkel (3),
 *   Cronenberg (4).
 *
 * Die "BEZIRK"-Kennung im offenen Kommunalwahlbezirke-Polygondatensatz der
 * Stadt Wuppertal (z.B. "06", "51") codiert direkt Stadtbezirk (erste
 * Ziffer) + laufende Kommunalwahlbezirk-Nummer innerhalb des Stadtbezirks -
 * exakt dieselbe Nummerierung wie in der Anlage.
 */
const WK32_KOMMUNALWAHLBEZIRKE = new Set([51, 53, 61, 62, 63, 64, 71, 72, 81, 82, 91, 92]);
const WK33_KOMMUNALWAHLBEZIRKE = new Set([1, 2, 3, 4, 5, 21, 22, 23, 24, 52, 54, 55]);
const WK34_KOMMUNALWAHLBEZIRKE = new Set([6, 11, 12, 13, 31, 32, 33, 41, 42]);

export function wahlkreisFuer(kommunalwahlbezirk: number): string {
  if (WK32_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) return "32";
  if (WK33_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) return "33";
  if (WK34_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) return "34";
  throw new BuildError(`Unbekannter Kommunalwahlbezirk "${kommunalwahlbezirk}".`);
}
