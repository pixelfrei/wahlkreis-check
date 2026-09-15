// Quelle: Stadt Hamm, Straßenverzeichnis zu den Kommunalwahlbezirken 2025 (PDF).
// https://www.hamm.de/fileadmin/user_upload/Medienarchiv_neu/Dokumente/Rathaus/Statistik_Wahl/Strassenverzeichnis_Stimmbezirke_Kommunalwahl.pdf
// Enthält KEINE Landtagswahlkreis-Spalte, aber pro Straße(-nabschnitt) den
// Stadtbezirk - darüber geht es analog zu Düsseldorf über die
// Landeswahlgesetz-Anlage (siehe wahlkreis.ts).
export const HAMM_QUELLE_URL =
  "https://www.hamm.de/fileadmin/user_upload/Medienarchiv_neu/Dokumente/Rathaus/Statistik_Wahl/Strassenverzeichnis_Stimmbezirke_Kommunalwahl.pdf";
export const HAMM_QUELLE_STAND = "2025";

export const HAMM_WAHLKREISE: Record<string, string> = {
  "117": "Unna III - Hamm II",
  "118": "Hamm I",
};
