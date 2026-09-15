// Quelle: Vote-Manager-Export der Stadt Solingen, Bundestagswahl 2021
// ("opendata-strassen.csv", wahlen.kdvz.nrw). Der aktuelle Kommunalwahl-
// 2025-Export ist inhaltlich leer (nur Kopfzeile) - der 2021er-Datensatz ist
// aber trotzdem nutzbar, weil die Stimmbezirk-Nummerierung seitdem stabil
// geblieben ist: die Ergebnis-API der aktuellen Kommunalwahl-2025-Präsentation
// (`.../daten/api/wahl_251/ergebnis_ebene_8_id_<Bezirksvertretung>_0.json`,
// Wahl der Bezirksvertretungen) listet für jede der fünf Bezirksvertretungen
// (Gräfrath, Mitte, Ohligs/Aufderhöhe/Merscheid, Burg/Höhscheid, Wald) exakt
// dieselben Stimmbezirk-Nummerngruppen (11-16, 21-27, 31-34, 41-46, 51-53)
// wie im 2021er-Straßenverzeichnis - siehe wahlkreis.ts für den vollen
// Abgleich. Keine offene Lizenz explizit angegeben; frei und ohne
// Zugangsbeschränkung abrufbares amtliches Verzeichnis.
export const SOLINGEN_STRASSEN_URL =
  "https://wahlen.kdvz.nrw/production/bw2021/05122000/daten/opendata/opendata-strassen.csv";
export const SOLINGEN_QUELLE_STAND = "2021-09";

export const SOLINGEN_WAHLKREISE: Record<string, string> = {
  "34": "Wuppertal III - Solingen II",
  "35": "Solingen I",
};
