import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Wahlkreis 56
 * ("Oberhausen I") umfasst die Stadtbezirke Alt-Oberhausen und Osterfeld
 * vollständig, Wahlkreis 57 ("Oberhausen II - Wesel I") den Stadtbezirk
 * Sterkrade vollständig (zusammen mit der Gemeinde Dinslaken, Kreis Wesel -
 * für diesen Build irrelevant).
 *
 * Die "Bezirk-Nr" im Straßenverzeichnis (z.B. "1803") codiert in den
 * führenden 1-2 Ziffern die amtliche Kommunalwahlbezirk-Nummer (01-29,
 * verifiziert über die Klartext-Bezirksnamen in opendata-wahllokale.csv,
 * z.B. "1301 Buschhausen"). Die Kommunalwahlbezirke sind den drei
 * Stadtbezirken wie folgt zugeordnet (verifiziert über die offizielle
 * Stadtteil-Liste auf oberhausen.de/Wikipedia je Stadtbezirk):
 *
 * Alt-Oberhausen (KWB 01-12): Stadtmitte-Süd/-Nord, Brücktor, Borbeck,
 *   Schlad, Vennepoth, Dümpten, Alstaden/Styrum, Alstaden-Süd/-West,
 *   Lirich-Süd/-Nord.
 * Sterkrade (KWB 13-24): Buschhausen, Schwarze Heide-Süd,
 *   Weierheide/Schwarze-Heide, Holten, Schmachtendorf/Walsumermark,
 *   Schmachtendorf-West, Sterkrade-Nord, Königshardt, Sterkrader
 *   Heide/Alsfeld, Alsfeld-West, Sterkrade-Mitte-Nord/-Süd.
 * Osterfeld (KWB 25-29): Klosterhardt-Nord, Klosterhardt/Heide-Nord,
 *   Eisenheim/Heide, Rothebusch, Osterfeld-Mitte.
 *
 * ACHTUNG numerische Nachbarschafts-Falle: KWB13 (Buschhausen) liegt
 * numerisch direkt neben dem Alt-Oberhausen-Block (01-12), gehört aber laut
 * offizieller Stadtteil-Zuordnung zu Sterkrade. Ebenso liegen KWB25-28
 * (Klosterhardt/Eisenheim/Rothebusch) numerisch mitten im Sterkrade-Block
 * (13-24), gehören aber zu Osterfeld. Beide Zuordnungen wurden unabhängig
 * über die Bezirksvertretungs-/Stadtteil-Zuordnung (nicht nur über die
 * numerische Nähe) verifiziert, bevor sie hier festgeschrieben wurden.
 *
 * Ein Kommunalwahlbezirk 90 (Briefwahlbezirk) existiert laut
 * opendata-wahllokale.csv, taucht aber im Straßenverzeichnis nicht auf.
 */
const WK56_KOMMUNALWAHLBEZIRKE = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 25, 26, 27, 28, 29,
]);
const WK57_KOMMUNALWAHLBEZIRKE = new Set([
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
]);

export function wahlkreisFuer(bezirkNr: number): string {
  const kwb = Math.floor(bezirkNr / 100);

  if (WK56_KOMMUNALWAHLBEZIRKE.has(kwb)) return "56";
  if (WK57_KOMMUNALWAHLBEZIRKE.has(kwb)) return "57";

  throw new BuildError(`Unbekannter Kommunalwahlbezirk "${kwb}" (aus Bezirk-Nr "${bezirkNr}").`);
}
