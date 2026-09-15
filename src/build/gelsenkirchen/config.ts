// Quelle: Wahlpräsentation der Stadt Gelsenkirchen, Landtagswahl 2022
// (Vote-Manager-Exporte "opendata-strassen.csv"). Keine offene Lizenz explizit
// angegeben; frei und ohne Zugangsbeschränkung abrufbares amtliches Verzeichnis.
// Enthält KEINE Landtagswahlkreis-Spalte, aber die erste Ziffer der Bezirk-Nr
// (z.B. "5106") ist direkt die amtliche Stadtbezirk-Nummer (1-5), über die die
// Landeswahlgesetz-Anlage geht (siehe wahlkreis.ts) - verifiziert über die
// Klartext-Einrichtungsnamen in opendata-wahllokale.csv (z.B. alle
// Stimmbezirke mit Präfix "2" liegen laut Wahlraum-Namen in Buer/Hassel,
// passend zum Stadtbezirk "2 Gelsenkirchen-Nord").
export const GELSENKIRCHEN_STRASSEN_URL =
  "https://wahl.gelsenkirchen.de/votemanager/20220515/05513000/daten/opendata/opendata-strassen.csv";
export const GELSENKIRCHEN_QUELLE_STAND = "2022-05";

export const GELSENKIRCHEN_WAHLKREISE: Record<string, string> = {
  "73": "Gelsenkirchen I - Recklinghausen V",
  "74": "Gelsenkirchen II",
};
