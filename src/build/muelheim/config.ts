// Quelle: Wahlpräsentation der Stadt Mülheim an der Ruhr, Kommunalwahl 2025
// (Vote-Manager-Exporte "opendata-strassen.csv"). Keine offene Lizenz explizit
// angegeben; frei und ohne Zugangsbeschränkung abrufbares amtliches Verzeichnis.
// Enthält KEINE Landtagswahlkreis-Spalte, aber pro Straße(-nabschnitt) einen
// Stimmbezirk (Bezirk-Nr) - dessen erste zwei Ziffern sind der
// Kommunalwahlbezirk, über den die Landeswahlgesetz-Anlage geht (wahlkreis.ts).
export const MUELHEIM_STRASSEN_URL =
  "https://wahlpraesentation.muelheim-ruhr.de/kw25/05117000/daten/opendata/opendata-strassen.csv";
export const MUELHEIM_QUELLE_STAND = "2025-09";

export const MUELHEIM_WAHLKREISE: Record<string, string> = {
  "39": "Mettmann III - Mülheim II",
  "64": "Mülheim I",
};
