// Quelle: Wahlpräsentation der Stadt Datteln, Kommunalwahl 2025
// (Vote-Manager-Exporte "opendata-strassen.csv"). Keine offene Lizenz explizit
// angegeben; frei und ohne Zugangsbeschränkung abrufbares amtliches Verzeichnis.
// Enthält KEINE Landtagswahlkreis-Spalte, aber pro Straße(-nabschnitt) einen
// Wahlbezirk (Bezirk-Nr, z.B. "01.0") - siehe wahlkreis.ts für die Zuordnung
// zum Landtagswahlkreis über die Landeswahlgesetz-Anlage.
export const DATTELN_STRASSEN_URL =
  "https://wahlen.gkd-re.net/20250914/05562008/daten/opendata/opendata-strassen.csv";
export const DATTELN_QUELLE_STAND = "2025-09";

export const DATTELN_WAHLKREISE: Record<string, string> = {
  "71": "Recklinghausen III",
  "72": "Recklinghausen IV",
};
