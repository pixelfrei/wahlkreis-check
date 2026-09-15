// Quelle: dieselben zwei landesweiten Geodatensätze wie bei Altenbeken -
// Sankt Augustin hat weder ein Vote-Manager-Straßenverzeichnis (bei allen 5
// geprüften Wahlterminen leer) noch einen eigenen Adress- oder
// Ortsteilgrenzen-Datensatz.
//
// 1. Landesweiter ALKIS-WFS-Dienst (siehe src/build/alkisGemarkung.ts) -
//    liefert 8 der 9 Sankt Augustiner Stadtteile als Gemarkungen
//    (Hangelar, Niedermenden, Niederpleis, Obermenden, Siegburg-Mülldorf,
//    Birlinghoven, Buisdorf, Meindorf). Der Anlage-Stadtteil "Ort" hat keine
//    eigene Gemarkung - für die Wahlkreis-Zuordnung folgenlos, siehe
//    wahlkreis.ts.
// 2. "Gebäudereferenzen NW" (siehe src/build/gebref.ts) - dieselbe
//    landesweite Adressquelle wie bei Marl/Altenbeken.
//
// Wie bei Bielefeld/Aachen/Wuppertal/Marl/Altenbeken eine berechnete
// Zuordnung (`zuordnung: "berechnet"`).
export const SANKT_AUGUSTIN_BBOX = { minLat: 50.7, minLon: 7.1, maxLat: 50.85, maxLon: 7.3 };
export const SANKT_AUGUSTIN_GEMEINDE = "Sankt Augustin";
export const SANKT_AUGUSTIN_GEBREF_MARKER = ";82;Rhein-Sieg-Kreis;056;Sankt Augustin;";
export const SANKT_AUGUSTIN_QUELLE_STAND = "2026-07";

export const SANKT_AUGUSTIN_WAHLKREISE: Record<string, string> = {
  "28": "Rhein-Sieg-Kreis IV",
  "29": "Rhein-Sieg-Kreis V",
};
