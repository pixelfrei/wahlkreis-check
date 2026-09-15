import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Wahlkreis 103
 * ("Hagen I") umfasst die Wahlbezirke 01-08 und 11-20 (Mittelstadt,
 * Altenhagen-Süd/-West/-Ost, Fleyer Viertel, Eppenhausen, Emst, Remberg,
 * Boele/Hengstey/Brockhausen, Kabel/Bathey/Garenfeld, Helfe/Fley,
 * Boelerheide, Vorhalle/Eckesey, Hohenlimburg-Nord/-Ost/-Süd/-West,
 * Eilpe-Zentrum/Oberhagen) - komplett innerhalb Hagens. Wahlkreis 104
 * ("Hagen II - Ennepe-Ruhr-Kreis III") umfasst die Wahlbezirke 09, 10,
 * 21-26 (Wehringhausen/Stadtgarten, Wehringhausen/Kuhlerkamp, Eilper
 * Feld/Delstern, Dahl/Volmetal, Geweke/Spielbrink, Haspe-Mitte/
 * Kückelhausen, Hestert/Steinplatz, Westerbauer/Quambusch) zusammen mit
 * den kompletten Gemeinden Breckerfeld, Ennepetal und Gevelsberg (Ennepe-
 * Ruhr-Kreis, für diesen Build irrelevant).
 *
 * Die "Bezirk-Nr" im Straßenverzeichnis ist immer vierstellig: führende
 * Ziffer = Stadtbezirk (1-5, für die Zuordnung irrelevant), mittlere zwei
 * Ziffern = amtliche Wahlbezirk-Nummer (01-26), letzte Ziffer = laufende
 * Stimmbezirk-Nummer innerhalb des Wahlbezirks. Verifiziert über das
 * offizielle "Wahlbuch" der Kommunalwahl 2025 (Klartext-Wahlbezirks- und
 * Stimmbezirksnamen, z.B. Stimmbezirke 4203-4205 "Untere Selbecker
 * Str."/"Hüttenbergstr."/"Franzstraße" gehören trotz Stadtbezirk-Präfix "4"
 * (Eilpe-Dahl) zu Wahlbezirk 20 "Eilpe-Zentrum/Oberhagen" - derselbe
 * Wahlbezirk wie die Stimmbezirke 1201/1202 mit Stadtbezirk-Präfix "1"
 * (Hagen-Mitte). Das zeigt: der Wahlbezirk selbst kann über zwei
 * Stadtbezirke hinweg reichen, die mittleren zwei Ziffern bleiben aber
 * trotzdem die verlässliche Quelle - nicht der Stadtbezirk-Präfix).
 */
const WK103_WAHLBEZIRKE = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
]);
const WK104_WAHLBEZIRKE = new Set([9, 10, 21, 22, 23, 24, 25, 26]);

export function wahlkreisFuer(bezirkNr: number): string {
  const wahlbezirk = Math.floor(bezirkNr / 10) % 100;

  if (WK103_WAHLBEZIRKE.has(wahlbezirk)) return "103";
  if (WK104_WAHLBEZIRKE.has(wahlbezirk)) return "104";

  throw new BuildError(`Unbekannter Wahlbezirk "${wahlbezirk}" (aus Bezirk-Nr "${bezirkNr}").`);
}
