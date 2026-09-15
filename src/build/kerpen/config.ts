// Quelle: Wahlpräsentation der Kolpingstadt Kerpen, Kommunalwahl 2025
// (Vote-Manager-Exporte "opendata-strassen.csv"). Keine offene Lizenz explizit
// angegeben; frei und ohne Zugangsbeschränkung abrufbares amtliches Verzeichnis.
// Enthält KEINE Landtagswahlkreis-Spalte, aber pro Straße(-nabschnitt) einen
// Stimmbezirk (Bezirk-Nr, z.B. "08.2") - dessen Bezirk-Name (aus
// opendata-wahllokale.csv) nennt den Ortsteil, über den die
// Landeswahlgesetz-Anlage geht (siehe wahlkreis.ts).
export const KERPEN_STRASSEN_URL =
  "https://wahlen.kdvz.nrw/production/kw2025/05362032/daten/opendata/opendata-strassen.csv";
export const KERPEN_QUELLE_STAND = "2025-09";

export const KERPEN_WAHLKREISE: Record<string, string> = {
  "6": "Rhein-Erft-Kreis II",
  "7": "Rhein-Erft-Kreis III",
};
