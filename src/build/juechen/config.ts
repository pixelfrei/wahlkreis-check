// Quelle: Wahlpräsentation der Gemeinde Jüchen, Kommunalwahl 2025
// (Vote-Manager-Exporte "opendata-strassen.csv"). Keine offene Lizenz explizit
// angegeben; frei und ohne Zugangsbeschränkung abrufbares amtliches Verzeichnis.
// Enthält KEINE Landtagswahlkreis-Spalte, aber pro Straße(-nabschnitt) einen
// Stimmbezirk (Bezirk-Nr, z.B. "0151") - dessen erste zwei bis drei Ziffern
// (durch 10 geteilt) sind die Kommunalwahlbezirk-Nummer, über die die
// Landeswahlgesetz-Anlage geht (siehe wahlkreis.ts).
export const JUECHEN_STRASSEN_URL =
  "https://wep.itk-rheinland.de/vm/prod/kw_2025/05162012/daten/opendata/opendata-strassen.csv";
export const JUECHEN_QUELLE_STAND = "2025-09";

export const JUECHEN_WAHLKREISE: Record<string, string> = {
  "46": "Rhein-Kreis Neuss II",
  "47": "Rhein-Kreis Neuss III",
};
