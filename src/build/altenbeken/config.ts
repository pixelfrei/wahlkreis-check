// Quelle: zwei unabhängige, landesweite Geodatensätze - Altenbeken hat wie
// Marl weder ein Vote-Manager-Straßenverzeichnis (bei allen 8 geprüften
// Wahlterminen seit 2009 leer) noch einen eigenen Adress- oder
// Ortsteilgrenzen-Datensatz.
//
// 1. Landesweiter ALKIS-WFS-Dienst (siehe src/build/alkisGemarkung.ts) -
//    liefert die drei Gemarkungen Altenbekens (Buke, Schwaney, Altenbeken
//    selbst), die den Ortsteilen exakt entsprechen: alle drei waren bis zur
//    Gebietsreform 1975 eigenständige Gemeinden.
// 2. "Gebäudereferenzen NW" (siehe src/build/gebref.ts) - dieselbe
//    landesweite Adressquelle wie bei Marl.
//
// Wie bei Bielefeld/Aachen/Wuppertal/Marl eine berechnete Zuordnung
// (`zuordnung: "berechnet"`) - siehe wahlkreis.ts für die
// Ortsteil->Wahlkreis-Regel.
export const ALTENBEKEN_BBOX = { minLat: 51.72, minLon: 8.85, maxLat: 51.82, maxLon: 9.02 };
export const ALTENBEKEN_GEMEINDE = "Altenbeken";
export const ALTENBEKEN_GEBREF_MARKER = ";74;Paderborn;004;Altenbeken;";
export const ALTENBEKEN_QUELLE_STAND = "2026-07";

export const ALTENBEKEN_WAHLKREISE: Record<string, string> = {
  "100": "Paderborn I",
  "101": "Paderborn II",
};
