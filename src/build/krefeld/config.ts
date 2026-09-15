// Quelle: Open.NRW / Offenes Datenportal, Datensatz "Straßenverzeichnis
// 12/2016 der Stadt Krefeld" (Stand 31.12.2016).
// https://open.nrw/dataset/strabenverzeichnis-12-2016-der-stadt-krefeld-odp
// Straße -> Stimmbezirk/Stadtbezirk direkt, aber mit VERALTETEN
// Landtagswahlkreis-Nummern (47/48, vor der Wahlkreisreform 2021) - die
// werden hier ignoriert. Stattdessen wird die Stadtbezirk-Nummer (1-9, seit
// Jahrzehnten unverändert) direkt mit der aktuellen Landeswahlgesetz-Anlage
// kombiniert (siehe wahlkreis.ts). Jede Straße trägt in dieser Quelle genau
// eine Stadtbezirk-Nummer - keine Aufteilung nach Hausnummernbereich nötig.
export const KREFELD_STRASSEN_URL =
  "https://www.offenesdatenportal.de/dataset/c1c44089-daa8-4cfa-9f04-9b781d3d4dbd/resource/9961d575-50d8-4916-983e-58dc37ff3e51/download/strassenverzeichnis-dezember-2016.csv";
export const KREFELD_QUELLE_STAND = "2016-12-31";

export const KREFELD_WAHLKREISE: Record<string, string> = {
  "48": "Krefeld I - Viersen III",
  "49": "Krefeld II",
};
