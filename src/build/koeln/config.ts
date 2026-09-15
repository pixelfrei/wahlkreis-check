// Quelle: Offene Daten Köln, Datensatz "Kölner Straßenverzeichnis"
// https://www.offenedaten-koeln.de/dataset/koelner-strassenverzeichnis
// Die "WAHL"-Fassung enthält pro Straßenabschnitt Stimmbezirk, Kommunal-,
// Landtags- und Bundestagswahlkreis direkt - kein Join wie bei Dortmund nötig.
// Wird halbjährlich neu veröffentlicht; bei einer neuen Fassung hier die URL
// und den Stand austauschen.
export const KOELN_QUELLE_URL =
  "https://www.offenedaten-koeln.de/sites/default/files/distribution/Stra%25C3%259Fenverzeichnis_WAHL_2025-07-15.xlsx";
export const KOELN_QUELLE_STAND = "2025-07-15";

// Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW - die Excel-Datei selbst
// führt nur die Nummer, keinen Namen.
export const KOELN_WAHLKREISE: Record<string, string> = {
  "13": "Köln I",
  "14": "Köln II",
  "15": "Köln III",
  "16": "Köln IV",
  "17": "Köln V",
  "18": "Köln VI",
  "19": "Köln VII",
};
