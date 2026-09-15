// Quelle: zwei offene Geodatensätze der Stadt Wuppertal
// (offenedaten-wuppertal.de), CC BY 4.0.
//
// 1. "Kommunalwahlbezirke Wuppertal" - 33 Polygone mit Feld "BEZIRK" (z.B.
//    "06", "51"), das direkt Stadtbezirk + laufende Kommunalwahlbezirk-
//    Nummer codiert - exakt die Nummerierung der Landeswahlgesetz-Anlage.
// 2. "Georeferenzierte Bestandsadressen Wuppertal" - amtliche Adresspunkte
//    (Straßenname, Hausnummer, Adresszusatz als eigene Spalte, Koordinate),
//    wöchentlich aus ALKIS aktualisiert.
//
// Wie bei Bielefeld/Aachen eine berechnete Zuordnung
// (`zuordnung: "berechnet"`) - siehe wahlkreis.ts für die
// Kommunalwahlbezirk->Wahlkreis-Regel.
export const WUPPERTAL_KOMMUNALWAHLBEZIRKE_URL =
  "https://daten.wuppertal.de/Politik_Wahlen/Kommunalwahlbezirke_EPSG25832_JSON.json";
export const WUPPERTAL_ADRESSEN_URL =
  "https://daten.wuppertal.de/Geografie_Geologie_Geodaten/Adressen_EPSG25832_JSON.json";
export const WUPPERTAL_QUELLE_STAND = "2026-09";

export const WUPPERTAL_WAHLKREISE: Record<string, string> = {
  "32": "Wuppertal I",
  "33": "Wuppertal II",
  "34": "Wuppertal III - Solingen II",
};
