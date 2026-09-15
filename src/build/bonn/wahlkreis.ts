import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Bonns Wahlkreise
 * teilen sich fast vollständig nach Kommunalwahlbezirk-Nummer (01-16, 21-27,
 * 31-37, 41-43) - nur Kommunalwahlbezirk 14 (Endenich II) ist selbst noch auf
 * Stimmbezirk-Ebene geteilt (141/142/144 -> Wahlkreis 30, 143/145 ->
 * Wahlkreis 31).
 *
 * Der Vote-Manager-Datensatz führt die Kommunalwahlbezirk-Nummer als die
 * ersten Ziffern der Bezirk-Nr (durch 10 geteilt, ganzzahlig ergibt die
 * Kommunalwahlbezirk-Nummer, die letzte Ziffer unterscheidet Stimmbezirke
 * innerhalb desselben Kommunalwahlbezirks) - verifiziert über die
 * Klartextnamen in opendata-wahllokale.csv, die für jeden Kommunalwahlbezirk
 * exakt den Anlage-Namen tragen (z.B. "Briefwahlbezirk 020 (Bonn-Castell /
 * Rheindorf-Süd)" = Kommunalwahlbezirk "02 Bonn-Castell/Rheindorf-Süd").
 */
const WK30_STIMMBEZIRKE_KWB14 = new Set(["141", "142", "144"]);
const WK31_STIMMBEZIRKE_KWB14 = new Set(["143", "145"]);

const WK30_KOMMUNALWAHLBEZIRKE = new Set([1, 2, 3, 4, 5, 6, 7, 8, 13, 31, 32, 33, 34, 35, 36, 37]);
const WK31_KOMMUNALWAHLBEZIRKE = new Set([9, 10, 11, 12, 15, 16, 21, 22, 23, 24, 25, 26, 27, 41, 42, 43]);

export function wahlkreisFuer(bezirkNr: string): string {
  if (WK30_STIMMBEZIRKE_KWB14.has(bezirkNr)) return "30";
  if (WK31_STIMMBEZIRKE_KWB14.has(bezirkNr)) return "31";

  const kommunalwahlbezirk = Math.floor(parseInt(bezirkNr, 10) / 10);
  if (WK30_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) return "30";
  if (WK31_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) return "31";

  throw new BuildError(`Unbekannter Kommunalwahlbezirk "${kommunalwahlbezirk}" (aus Bezirk-Nr "${bezirkNr}").`);
}
