// Quelle: Open Data Düsseldorf, Datensatz "Straßenverzeichnis Düsseldorf"
// https://opendata.duesseldorf.de/dataset/stra%C3%9Fenverzeichnis-d%C3%BCsseldorf
// Datenlizenz Deutschland Zero 2.0. Enthält KEINE Wahlkreis-Spalte - anders als
// Dortmund/Köln wird hier über Stadtbezirk/Stadtteil gegangen (siehe wahlkreis.ts).
// Der einzige echte Wahl-Datensatz der Stadt (Straßenverzeichnis_Kommunalwahl_...)
// steht unter "Andere geschlossene Lizenz" und darf hier nicht verwendet werden.
export const DUESSELDORF_QUELLE_URL =
  "https://opendata.duesseldorf.de/sites/default/files/Strassenverzeichnis_LHD_2025.csv";
export const DUESSELDORF_QUELLE_STAND = "2025-01";

export const DUESSELDORF_WAHLKREISE: Record<string, string> = {
  "41": "Düsseldorf I",
  "42": "Düsseldorf II",
  "43": "Düsseldorf III",
  "44": "Düsseldorf IV",
};
