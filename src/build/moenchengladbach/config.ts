// Quelle: Wahlpräsentation der Stadt Mönchengladbach, Kommunalwahl 2025
// (Vote-Manager-Exporte "opendata-strassen.csv"). Keine offene Lizenz explizit
// angegeben; frei und ohne Zugangsbeschränkung abrufbares amtliches Verzeichnis.
// Enthält KEINE Landtagswahlkreis-Spalte, und die "Bezirk-Nr" (z.B. "10801")
// folgt KEINER einfachen Formel zur amtlichen Stadtteil-Nummer der
// Landeswahlgesetz-Anlage - anders als bei Essen/Bonn/Münster. Die Zuordnung
// der 33 Wahlbezirk-Präfixe (erste drei Ziffern der Bezirk-Nr) zu den
// Wahlkreisen wurde stattdessen über die Klartext-Ortsangaben in
// opendata-wahllokale.csv (Schul-/Einrichtungsnamen) rekonstruiert, jeweils
// unabhängig gegen die Anlage-Stadtteilnamen verifiziert (siehe wahlkreis.ts).
export const MOENCHENGLADBACH_STRASSEN_URL =
  "https://wep.itk-rheinland.de/vm/prod/kw_2025/05116000/daten/opendata/opendata-strassen.csv";
export const MOENCHENGLADBACH_QUELLE_STAND = "2025-09";

export const MOENCHENGLADBACH_WAHLKREISE: Record<string, string> = {
  "50": "Mönchengladbach I",
  "51": "Mönchengladbach II",
};
