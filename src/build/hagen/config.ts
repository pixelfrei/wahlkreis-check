// Quelle: Vote-Manager-Export der Stadt Hagen, Kommunalwahl 2025
// ("opendata-strassen.csv", wahlergebnisse.stadt-hagen.de). Keine offene
// Lizenz explizit angegeben; frei und ohne Zugangsbeschränkung abrufbares
// amtliches Verzeichnis. Enthält KEINE Landtagswahlkreis-Spalte, aber die
// "Bezirk-Nr" (z.B. "1091", vierstellig) codiert in den mittleren zwei
// Ziffern die amtliche Wahlbezirk-Nummer (01-26 laut Landeswahlgesetz-
// Anlage), über die auch die Anlage selbst geht (siehe wahlkreis.ts) - die
// führende Ziffer ist nur die (für die Zuordnung irrelevante) Stadtbezirk-
// Nummer (1 Hagen-Mitte, 2 Hagen-Nord, 3 Hohenlimburg, 4 Eilpe-Dahl,
// 5 Haspe), die letzte Ziffer eine fortlaufende Stimmbezirk-Nummer
// innerhalb des Wahlbezirks. Verifiziert über die Klartext-Wahlbezirks-
// und Stimmbezirksnamen im offiziellen "Wahlbuch" der Kommunalwahl 2025
// (z.B. Stimmbezirke 1031 "Adolf-/Sedanstr." und 1032 "Brink-/Altenhagener
// Str." unter Wahlbezirk 03 "Altenhagen-West").
export const HAGEN_STRASSEN_URL =
  "https://wahlergebnisse.stadt-hagen.de/prod/KW2025/05914000/daten/opendata/opendata-strassen.csv";
export const HAGEN_QUELLE_STAND = "2025-09";

export const HAGEN_WAHLKREISE: Record<string, string> = {
  "103": "Hagen I",
  "104": "Hagen II - Ennepe-Ruhr-Kreis III",
};
