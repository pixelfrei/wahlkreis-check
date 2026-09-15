// Quelle: Vote-Manager-Export der Stadt Hennef (Sieg), Bundestagswahl 2021
// ("opendata-strassen.csv", wahlen.kdvz.nrw). Der aktuelle Kommunalwahl-
// 2025-Export ist inhaltlich leer (nur Kopfzeile) - der 2021er-Datensatz ist
// aber nutzbar, weil die Stimmbezirk-Nummerierung seitdem stabil geblieben
// ist: die Ergebnis-API der aktuellen Kommunalwahl-2025-Präsentation
// (`.../daten/api/wahl_249/ergebnis_ebene_3_id_149_0.json`, Ratswahl auf
// Stadtebene) listet exakt dieselben 33 Stimmbezirk-Nummern (011-200) wie im
// 2021er-Straßenverzeichnis, siehe wahlkreis.ts für den vollen Abgleich.
// Keine offene Lizenz explizit angegeben; frei und ohne
// Zugangsbeschränkung abrufbares amtliches Verzeichnis.
export const HENNEF_STRASSEN_URL =
  "https://wahlen.kdvz.nrw/production/bw2021/05382020/daten/opendata/opendata-strassen.csv";
export const HENNEF_QUELLE_STAND = "2021-09";

export const HENNEF_WAHLKREISE: Record<string, string> = {
  "25": "Rhein-Sieg-Kreis I",
  "26": "Rhein-Sieg-Kreis II",
};
