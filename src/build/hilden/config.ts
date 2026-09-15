// Quelle: amtliche Beschlussvorlage der Stadt Hilden ("Einteilung des
// Hildener Stadtgebietes in Wahlbezirke", WP 20-25 SV 01/189/1,
// Wahlausschuss-Beschluss vom 07.10.2024), öffentlich über das
// Ratsinformationssystem (SessionNet) abrufbar - keine Anmeldung nötig.
//
// Anders als bei den anderen berechneten Städten (Bielefeld, Aachen,
// Wuppertal, Marl, Altenbeken, Sankt Augustin) KEIN Punkt-in-Polygon-
// Abgleich, sondern eine direkte Straße→Wahlbezirk-Tabelle (Anlage 1) -
// Hildens eigenes Geoportal (`geoportal.hilden.de`) verlangt für den
// Kartendienst selbst eine HTTP-Basic-Authentifizierung
// ("WWW-Authenticate: Basic realm=MapGuide"), ist also nicht offen
// zugänglich. Das PDF selbst enthält aber die vollständige Zuordnung als
// Text (Straße + Hausnummernbereich pro Wahlbezirk), siehe parse.ts.
export const HILDEN_WAHLBUCH_URL = "https://gi.hilden.de/bi/getfile.asp?id=119392&type=do";
export const HILDEN_QUELLE_STAND = "2024-09";

export const HILDEN_WAHLKREISE: Record<string, string> = {
  "37": "Mettmann I",
  "38": "Mettmann II",
};
