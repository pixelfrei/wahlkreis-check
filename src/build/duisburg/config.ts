// Quelle: Open Data Duisburg, Datensatz "Adressen", Ressource "Aktuell Hausnummern"
// https://opendata-duisburg.de/dataset/adressen
// Datenlizenz: Creative Commons Namensnennung 3.0 Deutschland (CC BY 3.0 DE).
// Enthält den Landtagswahlkreis direkt pro einzelner Hausnummer (nicht als
// Bereich) - feiner als Köln/Dortmund, aber ohne Bereichsbildung, die wir daher
// selbst vornehmen (siehe parse.ts).
export const DUISBURG_QUELLE_URL =
  "https://geoportal2.duisburg.de/scripts/hnr_auskunft/export/aktHNr_alle.csv";
export const DUISBURG_QUELLE_STAND = "2026-09-14"; // Datensatz wird laufend aktualisiert ("täglich")

export const DUISBURG_WAHLKREISE: Record<string, string> = {
  "61": "Duisburg I",
  "62": "Duisburg II",
  "63": "Duisburg III",
};
