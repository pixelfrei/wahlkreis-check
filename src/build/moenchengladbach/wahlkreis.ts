import { BuildError } from "../gruppierung.js";

/**
 * Mönchengladbachs "Bezirk-Nr" im Vote-Manager-Export (z.B. "10801") folgt
 * keiner einfachen Formel zur amtlichen Stadtteil-Nummer der
 * Landeswahlgesetz-Anlage (anders als bei Essen/Bonn/Münster, wo die
 * Bezirk-Nr die Stadtteil-Nummer direkt enthält). Die Anlage beschreibt die
 * Wahlkreise 50 ("Mönchengladbach I") und 51 ("Mönchengladbach II") über 44
 * einzeln benannte Stadtteile.
 *
 * Die 33 Wahlbezirk-Präfixe (erste drei Ziffern der Bezirk-Nr) wurden über
 * die Klartext-Einrichtungsnamen in opendata-wahllokale.csv rekonstruiert,
 * jeweils gegen die Anlage-Stadtteilnamen abgeglichen - für die meisten
 * Präfixe direkt (der Name der Schule/Einrichtung nennt den Stadtteil oder
 * einen unverwechselbaren Ortsteil davon, teils zusätzlich unabhängig per
 * Web-Recherche verifiziert, z.B. "Bischöfliche Marienschule" -> Windberg,
 * "Heinrich-Lersch-Schule" -> Lürrip, "Franz-Meyers-Gymnasium" -> Giesenkirchen).
 * Für eine Handvoll Präfixe (213, 215, 110) ergab sich die Zuordnung aus dem
 * Ausschlussverfahren gegen die vollständige, unabhängig gefundene Liste der
 * 33 Wahlbezirke eines Lokaljournal-Artikels (news.bz-mg.de/wahlbezirke-2025)
 * - die Namen dort sind Wortkombinationen aus mehreren Ortsteilen
 * (z.B. "13. Hardterbroich/Grünviertel"), ohne direkten Bezug zu den
 * Bezirk-Nr-Präfixen, aber in exakt derselben Anzahl (33) und mit densel­ben
 * Ortsteilnamen wie in den Einrichtungsnamen - die Zuordnung ergibt sich
 * dadurch eindeutig, auch ohne dass jeder einzelne Präfix eine direkte
 * Namensübereinstimmung hat.
 *
 * WK50 ("Mönchengladbach I"): die Rheydt- und Wickrath-Wahlbezirke (319-329,
 * 432, 433) sowie die Hardterbroich/Pesch/Lürrip- und Giesenkirchen-
 * Wahlbezirke (213, 214, 215, 230, 231).
 * WK51 ("Mönchengladbach II"): die zentrums-/nordnahen Wahlbezirke
 * (104-112), die Uedding/Neuwerk/Bettrath-Wahlbezirke (216, 217, 218) und die
 * Rheindahlen/Hehn/Holt-Wahlbezirke (401, 402, 403).
 */
const WK50_PRAEFIXE = new Set([
  "213", "214", "215", "230", "231",
  "319", "320", "321", "322", "323", "324", "325", "326", "327", "328", "329",
  "432", "433",
]);
const WK51_PRAEFIXE = new Set([
  "104", "105", "106", "107", "108", "109", "110", "111", "112",
  "216", "217", "218",
  "401", "402", "403",
]);

export function wahlkreisFuer(bezirkNr: string): string {
  const praefix = bezirkNr.slice(0, 3);
  if (WK50_PRAEFIXE.has(praefix)) return "50";
  if (WK51_PRAEFIXE.has(praefix)) return "51";
  throw new BuildError(`Unbekannter Wahlbezirk-Präfix "${praefix}" (aus Bezirk-Nr "${bezirkNr}").`);
}
