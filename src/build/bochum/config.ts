// Quelle: ArcGIS-Feature-Service "Wahlen" der Stadt Bochum
// (geoservicekkm.bochum.de). Enthält u.a. eine Layer "AdressenMitWahllokal"
// (Layer-ID 16) mit einer Zeile pro real existierender Adresse der Stadt
// Bochum, direkt verknüpft mit der amtlichen Kommunalwahlbezirk-Nummer
// (Feld "KWBezirk") - anders als beim sonst verwendeten Vote-Manager-Muster
// keine Bereichsliste, sondern jede einzelne Adresse individuell.
//
// Bochums eigener Vote-Manager-Export (`opendata-strassen.csv`, sowohl LW2022
// als auch km2025) ist durchgehend leer - dieser ArcGIS-Dienst ist die einzige
// gefundene Quelle mit echten Adressdaten.
//
// WICHTIG: die Layer-Felder "Straße"/"Hnr"/"HnrZ" sind fehlerhaft befüllt (sie
// mischen den Straßennamen des zugeordneten WAHLLOKALS mit der Hausnummer der
// tatsächlichen Adresse) - nicht verwendet. Stattdessen wird das Feld
// "AD_STRHNR" (unverarbeiteter Adresstext, z.B. "Achtermannstr. 1") selbst
// geparst (siehe index.ts).
export const BOCHUM_ADRESSEN_URL =
  "https://geoservicekkm.bochum.de/arcgis/rest/services/maponline/Wahlen/MapServer/16/query";
export const BOCHUM_QUELLE_STAND = "2025-09";

export const BOCHUM_WAHLKREISE: Record<string, string> = {
  "107": "Bochum I",
  "108": "Bochum II",
  "109": "Bochum III",
};
