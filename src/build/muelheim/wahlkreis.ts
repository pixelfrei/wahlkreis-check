import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: von der Stadt Mülheim
 * an der Ruhr gehen nur die Kommunalwahlbezirke 26 (Saarner Kuppe) und 27
 * (Saarn-Süd/Mintard/Selbeck) an Wahlkreis 39 (gemeinsam mit Teilen des Kreises
 * Mettmann). Die übrigen Kommunalwahlbezirke 01-25 bilden Wahlkreis 64.
 */
const WK39_KOMMUNALWAHLBEZIRKE = new Set(["26", "27"]);
const GUELTIGE_KOMMUNALWAHLBEZIRKE = new Set(
  Array.from({ length: 27 }, (_, i) => String(i + 1).padStart(2, "0")),
);

export function wahlkreisFuer(bezirkNr: string): string {
  const kwb = bezirkNr.slice(0, 2);
  if (!GUELTIGE_KOMMUNALWAHLBEZIRKE.has(kwb)) {
    throw new BuildError(`Unbekannter Kommunalwahlbezirk "${kwb}" (aus Bezirk-Nr "${bezirkNr}").`);
  }
  return WK39_KOMMUNALWAHLBEZIRKE.has(kwb) ? "39" : "64";
}
