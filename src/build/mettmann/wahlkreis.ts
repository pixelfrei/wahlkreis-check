import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: von der Stadt
 * Mettmann gehen die Kommunalwahlbezirke 5010 und 5040-5100 an Wahlkreis 38
 * ("Mettmann II"), die Kommunalwahlbezirke 5020, 5030 und 5110-5190 an
 * Wahlkreis 40 ("Mettmann IV"). Der Vote-Manager-Datensatz führt Bezirk 5190
 * geteilt in zwei Stimmbezirke (5191, 5192) - beide gehören weiterhin zum
 * Kommunalwahlbezirk 5190, erkennbar an den ersten drei Ziffern.
 */
const WK38_KOMMUNALWAHLBEZIRKE = new Set([5010, 5040, 5050, 5060, 5070, 5080, 5090, 5100]);
const WK40_KOMMUNALWAHLBEZIRKE = new Set([5020, 5030, 5110, 5120, 5130, 5140, 5150, 5160, 5170, 5180, 5190]);

export function wahlkreisFuer(bezirkNr: string): string {
  const nr = parseInt(bezirkNr, 10);
  const kommunalwahlbezirk = Math.floor(nr / 10) * 10;

  if (WK38_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) return "38";
  if (WK40_KOMMUNALWAHLBEZIRKE.has(kommunalwahlbezirk)) return "40";
  throw new BuildError(`Unbekannter Kommunalwahlbezirk "${kommunalwahlbezirk}" (aus Bezirk-Nr "${bezirkNr}").`);
}
