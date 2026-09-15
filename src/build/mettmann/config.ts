// Quelle: Wahlpräsentation der Stadt Mettmann, Kommunalwahl 2025
// (Vote-Manager-Exporte "opendata-strassen.csv"). Keine offene Lizenz explizit
// angegeben; frei und ohne Zugangsbeschränkung abrufbares amtliches Verzeichnis.
// Enthält KEINE Landtagswahlkreis-Spalte, aber pro Straße(-nabschnitt) direkt
// die Kommunalwahlbezirk-Nummer (z.B. "5150") - dieselbe Nummerierung wie in
// der Landeswahlgesetz-Anlage (siehe wahlkreis.ts), kein Namens-Umweg nötig.
export const METTMANN_STRASSEN_URL =
  "https://wahlen.regioit.de/3/km2025/05158024/daten/opendata/opendata-strassen.csv";
export const METTMANN_QUELLE_STAND = "2025-09";

export const METTMANN_WAHLKREISE: Record<string, string> = {
  "38": "Mettmann II",
  "40": "Mettmann IV",
};
