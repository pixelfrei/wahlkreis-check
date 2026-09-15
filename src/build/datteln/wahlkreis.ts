import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: von Datteln gehen nur
 * die Stadtbezirke 190 (Ahsen) und 280 (Bauerschaft Ostleven) an Wahlkreis 71
 * ("Recklinghausen III"), alle übrigen Stadtbezirke bilden Wahlkreis 72
 * ("Recklinghausen IV").
 *
 * Der amtliche Wahlbezirksplan der Stadt (Kommunalwahl 2025) nummeriert seine
 * 19 Wahlbezirke aber nicht nach diesen Stadtbezirk-Nummern, sondern einfach
 * 1-19 durchgezählt, ohne Namen. Wahlbezirk 1 enthält als einziger sowohl
 * ausschließlich Ahsen-Straßen (Ahsener Allee, größere Teile der Ahsener
 * Straße) als auch den Ostlevener Weg - und Ostleven wird unabhängig
 * bestätigt als Weiler innerhalb der Ahsener Gemeinheit (also geografisch/
 * historisch Teil desselben Gebiets). Das ist ein starkes, aber kein
 * amtlich-explizites Indiz - eine direkte Wahlbezirk-zu-Stadtbezirk-Nummer-
 * Tabelle wurde nicht gefunden. Wahlbezirk 1 wird deshalb komplett Wahlkreis
 * 71 zugeordnet, alle anderen (2-19) Wahlkreis 72.
 */
const WK71_WAHLBEZIRK = "01";

export function wahlkreisFuer(bezirkNr: string): string {
  const wahlbezirk = bezirkNr.split(".")[0]?.padStart(2, "0") ?? "";
  const nr = parseInt(wahlbezirk, 10);
  if (Number.isNaN(nr) || nr < 1 || nr > 19) {
    throw new BuildError(`Unbekannter Wahlbezirk "${wahlbezirk}" (aus Bezirk-Nr "${bezirkNr}").`);
  }
  return wahlbezirk === WK71_WAHLBEZIRK ? "71" : "72";
}
