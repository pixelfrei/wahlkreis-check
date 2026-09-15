// Quelle: zwei völlig unabhängige offene Geodatensätze - Marl selbst hat
// weder ein Vote-Manager-Straßenverzeichnis (bei jedem geprüften Wahltermin
// leer) noch einen eigenen Adressdatensatz mit Koordinaten.
//
// 1. WFS-Dienst des Kreises Recklinghausen (geoservice.gkd-re.de) - liefert
//    die 11 Marler Stadtteil-Polygone (10 "normale" + Polsum) mit Feld
//    "stadttnr". Nur als GML (kein GeoJSON-Output verfügbar), siehe
//    index.ts für den Parser.
// 2. "Gebäudereferenzen NW" (opengeodata.nrw.de) - ein einziges, LANDESWEITES
//    ASCII-Verzeichnis (~4,5 Mio. Zeilen, als ZIP) mit Straße, Hausnummer,
//    Buchstabenzusatz und Koordinate für jede Adresse in NRW, gefiltert im
//    Build-Script auf Marl (Kreis-Schlüssel 62 "Recklinghausen", Gemeinde-
//    Schlüssel 024 "Marl"). Trotz des Namens ("Referenzen") enthält jede
//    Zeile die vollständige postalische Adresse, nicht nur eine
//    Gebäude-ID - verifiziert durch Stichprobe.
//
// Wie bei Bielefeld/Aachen/Wuppertal eine berechnete Zuordnung
// (`zuordnung: "berechnet"`) - siehe wahlkreis.ts für die
// Stadtteil->Wahlkreis-Regel.
export const MARL_STADTTEILE_URL =
  "https://geoservice.gkd-re.de/wss/service/KreisRE_WFS_KRE-I03_GEBIETE/guest?service=WFS&version=1.1.0&request=GetFeature&typeName=Gebietsgliederung%3ASTADTTEILE_MARL&srsName=EPSG:25832";
export const MARL_GEBREF_URL =
  "https://www.opengeodata.nrw.de/produkte/geobasis/lk/akt/gebref_txt/gebref_EPSG25832_ASCII.zip";
export const MARL_QUELLE_STAND = "2026-07";

export const MARL_WAHLKREISE: Record<string, string> = {
  "70": "Recklinghausen II",
  "71": "Recklinghausen III",
};
