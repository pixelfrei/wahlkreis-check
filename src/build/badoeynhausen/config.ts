// Quelle: Wahlpräsentation der Stadt Bad Oeynhausen, Kommunalwahl 2025
// (Vote-Manager-Exporte "opendata-strassen.csv"). Keine offene Lizenz explizit
// angegeben; frei und ohne Zugangsbeschränkung abrufbares amtliches Verzeichnis.
// Enthält KEINE Landtagswahlkreis-Spalte, aber pro Straße(-nabschnitt) einen
// Wahlbezirk (Bezirk-Nr) - dessen Bezirk-Name (aus opendata-wahllokale.csv)
// nennt den Stadtteil, über den die Landeswahlgesetz-Anlage geht
// (siehe wahlkreis.ts).
export const BAD_OEYNHAUSEN_STRASSEN_URL =
  "https://wahl.owl-it.de/kw2025/05770004/daten/opendata/opendata-strassen.csv";
export const BAD_OEYNHAUSEN_QUELLE_STAND = "2025-09";

export const BAD_OEYNHAUSEN_WAHLKREISE: Record<string, string> = {
  "89": "Minden-Lübbecke II",
  "91": "Herford II - Minden-Lübbecke III",
};
