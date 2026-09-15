// Quelle: Stadt Münster, Stadtplanungsamt - "Straßenverzeichnis mit
// Stimmbezirk und Bezirksvertretung" (PDF, Stand 19.05.2025).
// https://www.stadt-muenster.de/fileadmin/user_upload/stadt-muenster/61_stadtentwicklung/pdf/Strassenverzeichnis_Muenster_mit_Stimmbezirk_und_Bezirksvertretung_vorlaeufig_20250519.pdf
// Straße/Hausnummernbereich -> Stimmbezirk (dreistellig, z.B. "215"). Enthält
// KEINE Landtagswahlkreis-Spalte, aber die ersten Ziffern des Stimmbezirks
// (durch 10 geteilt, ganzzahlig) sind die amtliche Kommunalwahlbezirk-Nummer,
// über die die Landeswahlgesetz-Anlage geht (siehe wahlkreis.ts) - verifiziert
// gegen die Klartext-Ortsangaben in den Wahlraum-Bezeichnungen der
// Kommunalwahl-2022-Wahllokale (z.B. Stimmbezirke 311-315 alle in
// "Gievenbeck", passend zu Kommunalwahlbezirk "31 Gievenbeck-Süd").
export const MUENSTER_QUELLE_URL =
  "https://www.stadt-muenster.de/fileadmin/user_upload/stadt-muenster/61_stadtentwicklung/pdf/Strassenverzeichnis_Muenster_mit_Stimmbezirk_und_Bezirksvertretung_vorlaeufig_20250519.pdf";
export const MUENSTER_QUELLE_STAND = "2025-05-19";

export const MUENSTER_WAHLKREISE: Record<string, string> = {
  "83": "Münster I - Steinfurt IV",
  "84": "Münster II",
  "85": "Münster III - Coesfeld III",
};
