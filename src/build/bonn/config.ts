// Quelle: Open Data Bonn, Datensatz "Landtagswahl 2022"
// https://opendata.bonn.de/dataset/landtagswahl-2022 (Datenlizenz offen).
// Straße/Hausnummernbereich -> Stimmbezirk (Bezirk-Nr, z.B. "371"). Enthält
// KEINE Landtagswahlkreis-Spalte, aber die ersten Ziffern der Bezirk-Nr
// (durch 10 geteilt, ganzzahlig) sind die amtliche Bonner
// Kommunalwahlbezirk-Nummer, über die die Landeswahlgesetz-Anlage geht
// (siehe wahlkreis.ts).
export const BONN_STRASSEN_URL =
  "https://wahlen.bonn.de/wahlen/LTW2022/05314000/praesentation/opendata-strassen.csv";
export const BONN_QUELLE_STAND = "2022-05";

export const BONN_WAHLKREISE: Record<string, string> = {
  "30": "Bonn I",
  "31": "Bonn II",
};
