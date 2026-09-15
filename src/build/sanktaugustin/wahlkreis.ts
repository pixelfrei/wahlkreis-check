import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Wahlkreis 28
 * ("Rhein-Sieg-Kreis IV") umfasst von Sankt Augustin nur den Stadtteil
 * Menden, Wahlkreis 29 ("Rhein-Sieg-Kreis V") die übrigen sieben
 * Stadtteile (Birlinghoven, Buisdorf, Hangelar, Meindorf, Mülldorf,
 * Niederpleis, Ort).
 *
 * Die ALKIS-Gemarkungen decken Sankt Augustin nur mit 8 statt 9 Namen ab:
 * "Menden" existiert als zwei getrennte historische Gemarkungen
 * (Niedermenden, Obermenden - beide -> WK28), aber der Stadtteil "Ort" hat
 * keine eigene Gemarkung. Das ist für die Wahlkreis-Zuordnung folgenlos:
 * "Ort" gehört wie alle übrigen sechs Gemarkungen zu Wahlkreis 29 - welche
 * davon "Ort" cadastral einschließt, muss also nicht geklärt werden, da
 * das Ergebnis für alle sechs identisch ist.
 */
const WK28_GEMARKUNGEN = new Set(["Niedermenden", "Obermenden"]);
const WK29_GEMARKUNGEN = new Set([
  "Hangelar",
  "Niederpleis",
  "Siegburg-Mülldorf",
  "Birlinghoven",
  "Buisdorf",
  "Meindorf",
]);

export function wahlkreisFuerGemarkung(gemarkung: string): string {
  if (WK28_GEMARKUNGEN.has(gemarkung)) return "28";
  if (WK29_GEMARKUNGEN.has(gemarkung)) return "29";
  throw new BuildError(`Unbekannte Gemarkung "${gemarkung}".`);
}
