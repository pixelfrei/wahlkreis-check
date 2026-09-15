// Quelle: Open Data Essen, Datensatz "Straßenverzeichnis und Wahllokale
// Landtagswahl 2022" (Datenlizenz Deutschland Namensnennung 2.0, offen).
// https://opendata.essen.de/dataset/stra%C3%9Fenverzeichnis-und-wahllokale-landtagswahl-2022
// Straße/Hausnummernbereich -> Stimmbezirk (Bezirk-Nr, z.B. "2903"). Enthält
// KEINE Landtagswahlkreis-Spalte, aber die ersten Ziffern der Bezirk-Nr (durch
// 100 geteilt, ganzzahlig) sind die amtliche Essener Stadtteil-Nummer (1-50,
// siehe stadtteile.ts), über die die Landeswahlgesetz-Anlage geht.
export const ESSEN_STRASSEN_URL =
  "https://opendata.essen.de/sites/default/files/opendata-strassen_0.csv";
export const ESSEN_QUELLE_STAND = "2022-05";

export const ESSEN_WAHLKREISE: Record<string, string> = {
  "65": "Essen I",
  "66": "Essen II",
  "67": "Essen III",
  "68": "Essen IV",
};
