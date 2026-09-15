// Quelle: zwei WFS-Dienste des GeoServers der Stadt Aachen
// (geoserver.aachen.de/opendata), Datenlizenz Deutschland - Namensnennung
// 2.0.
//
// 1. "bundestagswahl_2025_stimmbezirke" - liefert alle 162
//    Stimmbezirk-Polygone (MultiPolygon, teils mehrteilig) mit
//    vierstelliger Stimmbezirk-Nummer ("st_nr"). Trotz des Namens (aus der
//    Bundestagswahl-Präsentation) sind die Stimmbezirk-GRENZEN dieselben
//    wie bei der Kommunalwahl - es ist die physische Einteilung, keine
//    wahlspezifische Aggregation.
// 2. "ac_adressen" - amtliche Adresspunkte (Straße, Hausnummer,
//    Buchstabenzusatz, Koordinate) für jedes Gebäude in Aachen. Trägt zwar
//    ein Feld "stadtbeznr" (Stadtbezirk), das ist aber zu grob (Aachen-Mitte
//    ist laut Anlage selbst weiter nach Stadtteilen aufgeteilt) - deshalb
//    hier nicht verwendet, sondern über den Stimmbezirk-Layer aufgelöst.
//
// Wie bei Bielefeld ist dies eine berechnete Zuordnung
// (`zuordnung: "berechnet"`), kein direkter Bezug zu einer fertigen
// Bezirk-Tabelle - siehe wahlkreis.ts für die Stadtteil->Wahlkreis-Regel.
export const AACHEN_STIMMBEZIRKE_URL =
  "https://geoserver.aachen.de/opendata/wahlen/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=wahlen:bundestagswahl_2025_stimmbezirke&outputFormat=application/json";
export const AACHEN_ADRESSEN_URL =
  "https://geoserver.aachen.de/opendata/adressen/ows?&service=WFS&request=getfeature&typename=ac_adressen&outputformat=csv";
export const AACHEN_QUELLE_STAND = "2026-09";

export const AACHEN_WAHLKREISE: Record<string, string> = {
  "1": "Aachen I",
  "2": "Aachen II",
};
