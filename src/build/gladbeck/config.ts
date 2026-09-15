// Quelle: Amtliche Bekanntmachung der Stadt Gladbeck, Ausgabe 23/24 vom
// 30.10.2024 - "Wahlbezirksverzeichnis der Stadt Gladbeck auf Straßenebene zur
// Kommunalwahl 2025" (PDF, amtliches Verzeichnis im städtischen Amtsblatt).
// Enthält KEINE Landtagswahlkreis-Spalte, aber pro Straße(-nabschnitt) den
// Kommunalwahlbezirk (1-22) mit seinem Stadtbezirksnamen - darüber geht es wie
// bei Düsseldorf/Hamm über die Landeswahlgesetz-Anlage (siehe wahlkreis.ts).
export const GLADBECK_QUELLE_URL =
  "https://abo-online.gkd-re.de/abo-online/PDFAusgabe?Info=YWdzPTA1NTYyMDE0fGluZm89QW10c2JsYXR0fG5ldHo9MXxwZGY9Mzc3NTk%3D";
export const GLADBECK_QUELLE_STAND = "2024-10-30";

export const GLADBECK_WAHLKREISE: Record<string, string> = {
  "73": "Gelsenkirchen I - Recklinghausen V",
  "75": "Bottrop - Recklinghausen VI",
};
