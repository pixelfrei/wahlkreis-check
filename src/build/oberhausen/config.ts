// Quelle: Vote-Manager-Export der Stadt Oberhausen (RegioIT), Landtagswahl 2022
// ("opendata-strassen.csv"). Keine offene Lizenz explizit angegeben; frei und
// ohne Zugangsbeschränkung abrufbares amtliches Verzeichnis. Enthält KEINE
// Landtagswahlkreis-Spalte, aber die "Bezirk-Nr" (z.B. "1803") codiert in den
// führenden 1-2 Ziffern die amtliche Kommunalwahlbezirk-Nummer (1-29), über
// die die Landeswahlgesetz-Anlage geht (siehe wahlkreis.ts) - verifiziert
// über die Klartext-Namen der Kommunalwahlbezirke in opendata-wahllokale.csv
// (Bezirk-Name, z.B. "1301 Buschhausen") sowie unabhängig über die
// Bezirksvertretungs-/Stadtteil-Zuordnung auf oberhausen.de/wikipedia.
//
// WICHTIG: die AGS 05513000 (in einer früheren Recherche fälschlich für
// Oberhausen verwendet) gehört tatsächlich zu Gelsenkirchen. Die korrekte AGS
// für Oberhausen ist 05119000.
export const OBERHAUSEN_STRASSEN_URL =
  "https://wahlen.regioit.de/2/LW2022/05119000/daten/opendata/opendata-strassen.csv";
export const OBERHAUSEN_QUELLE_STAND = "2022-05";

export const OBERHAUSEN_WAHLKREISE: Record<string, string> = {
  "56": "Oberhausen I",
  "57": "Oberhausen II - Wesel I",
};
