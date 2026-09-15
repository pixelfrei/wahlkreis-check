// Quelle: zwei WFS-Dienste der Stadt Bielefeld (bielefeld01.de), beide unter
// Datenlizenz Deutschland - Zero - Version 2.0.
//
// 1. "Wahlkreis_Land" (Landtagswahlkreise) aus dem offenen Datensatz "Wahlen
//    (Stimmbezirke, Wahlbezirke, Landtagswahlkreise)" - liefert die drei
//    Landtagswahlkreis-Polygone (92/93/94) DIREKT, kein
//    Kommunalwahlbezirk-Zwischenschritt nötig.
// 2. "ALKIS Gebäude - Hauskoordinaten" - amtliche Adresspunkte (Straße,
//    Hausnummer, Koordinate) für jedes Gebäude in Bielefeld.
//
// Da hier erstmals ein geometrischer Punkt-in-Polygon-Abgleich (nicht nur
// eine bereits fertige Bezirk-Tabelle) die Zuordnung herstellt, trägt dieser
// Datensatz `zuordnung: "berechnet"` statt `"gesetzesanlage"` - die
// Landtagswahlkreis-Grenze selbst kommt zwar direkt aus einem amtlichen
// Datensatz, aber die Verknüpfung zur einzelnen Adresse wird hier im
// Build-Script berechnet, nicht von der Stadt selbst geliefert.
export const BIELEFELD_LWK_URL =
  "https://www.bielefeld01.de/md/WFS/wahlen/02?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=wahlkreis_land_pl_view&SRSNAME=EPSG:25832&OUTPUTFORMAT=text/csv";
export const BIELEFELD_ADRESSEN_URL =
  "https://www.bielefeld01.de/md/WFS/alkis_light/04?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=alkis_hauskoordinaten_p&SRSNAME=EPSG:25832&OUTPUTFORMAT=text/csv";
export const BIELEFELD_QUELLE_STAND = "2026-09";

export const BIELEFELD_WAHLKREISE: Record<string, string> = {
  "92": "Bielefeld I",
  "93": "Bielefeld II",
  "94": "Gütersloh I - Bielefeld III",
};
