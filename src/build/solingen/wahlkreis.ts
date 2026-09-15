import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Wahlkreis 34
 * ("Wuppertal III - Solingen II") umfasst von Solingen den kompletten
 * Stadtbezirk Gräfrath sowie vom Stadtbezirk Mitte die Kommunalwahlbezirke
 * 15 "Klauberg-Hasseldelle-Kohlfurth" und 16 "Kannenhof-Meigen-Halfeshof",
 * dazu aus Kommunalwahlbezirk 12 "Innenstadt-Süd" nur den einzelnen
 * Stimmbezirk 123 (feinere Auflösung als Kommunalwahlbezirk-Ebene nötig!).
 * Wahlkreis 35 ("Solingen I") ist der Rest: Stadtbezirk Mitte ohne KWB 15/16
 * und ohne Stimmbezirk 123 aus KWB12, plus die kompletten Stadtbezirke
 * Ohligs/Aufderhöhe/Merscheid, Burg/Höhscheid und Wald.
 *
 * Die "Bezirk-Nr" im Straßenverzeichnis ist immer dreistellig (z.B. "123",
 * "342"): erste Ziffer = Stadtbezirk (1 Mitte, 2 Ohligs/Aufderhöhe/
 * Merscheid, 3 Wald, 4 Burg/Höhscheid, 5 Gräfrath), zweite Ziffer =
 * Kommunalwahlbezirk innerhalb des Stadtbezirks, dritte Ziffer = laufende
 * Stimmbezirk-Nummer. Die ersten zwei Ziffern zusammen ergeben die amtliche
 * Kommunalwahlbezirk-Nummer (11-16, 21-27, 31-34, 41-46, 51-53).
 *
 * Verifiziert über die Ergebnis-API der aktuellen Kommunalwahl-2025-
 * Präsentation (`wahl_251` = Wahl der Bezirksvertretungen): jede der fünf
 * Bezirksvertretungen listet exakt die erwarteten Stimmbezirk-Nummerngruppen
 * (z.B. Bezirksvertretung "Gräfrath" -> Stimmbezirke 511-514, 521-524,
 * 531-533; Bezirksvertretung "Mitte" -> 111-163 inkl. 121/122/123) - die
 * Stadtbezirk-Zuordnung der Kommunalwahlbezirk-Ziffern ist damit amtlich
 * bestätigt, nicht nur aus dem 2021er-Datensatz vermutet.
 */
const WK34_KOMMUNALWAHLBEZIRKE = new Set([15, 16, 51, 52, 53]);
const SOLINGEN_KOMMUNALWAHLBEZIRKE = new Set([
  11, 12, 13, 14, 15, 16, 21, 22, 23, 24, 25, 26, 27, 31, 32, 33, 34, 41, 42, 43, 44, 45, 46, 51,
  52, 53,
]);

export function wahlkreisFuer(bezirkNr: number): string {
  // Sonderfall VOR der allgemeinen Kommunalwahlbezirk-Regel: innerhalb KWB12
  // ("Innenstadt-Süd") geht nur der einzelne Stimmbezirk 123 an WK34, der
  // Rest von KWB12 (121, 122) bleibt WK35.
  if (bezirkNr === 123) return "34";

  const kwb = Math.floor(bezirkNr / 10);
  if (!SOLINGEN_KOMMUNALWAHLBEZIRKE.has(kwb)) {
    throw new BuildError(`Unbekannter Kommunalwahlbezirk "${kwb}" (aus Bezirk-Nr "${bezirkNr}").`);
  }

  return WK34_KOMMUNALWAHLBEZIRKE.has(kwb) ? "34" : "35";
}
