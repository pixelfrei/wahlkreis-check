import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: von Kerpen gehen die
 * Stadtbezirke Balkhausen, Brüggen/Türnich und Kerpen (die Kernstadt) an
 * Wahlkreis 7 ("Rhein-Erft-Kreis III"). Die übrigen Stadtbezirke
 * (Mödrath/Kerpen-Nord, Blatzheim, Buir, Manheim, Sindorf, Horrem,
 * Neu-Bottenbroich/Horrem-Nord-Ost) bilden Wahlkreis 6 ("Rhein-Erft-Kreis
 * II"). Der Vote-Manager-Datensatz kennt keine Stadtbezirke direkt, nur
 * Stimmbezirk-Nummern ("Bezirk-Nr", z.B. "08.2") - deren ersten zwei Ziffern
 * (der Stimmbezirks-Präfix) sind über opendata-wahllokale.csv einem Ortsteil
 * zugeordnet: 02-05 sind die Kernstadt Kerpen selbst, 20-23 sind
 * Türnich/Balkhausen/Brüggen - beide Gruppen zusammen Wahlkreis 7. Alle
 * anderen Präfixe (01, 06-19) liegen in den übrigen, bei Wahlkreis 6
 * verbleibenden Stadtbezirken.
 */
const WK7_PRAEFIXE = new Set(["02", "03", "04", "05", "20", "21", "22", "23"]);
const GUELTIGE_PRAEFIXE = new Set(
  Array.from({ length: 23 }, (_, i) => String(i + 1).padStart(2, "0")),
);

export function wahlkreisFuer(bezirkNr: string): string {
  const praefix = bezirkNr.split(".")[0]?.padStart(2, "0") ?? "";
  if (!GUELTIGE_PRAEFIXE.has(praefix)) {
    throw new BuildError(`Unbekannter Stimmbezirk-Präfix "${praefix}" (aus Bezirk-Nr "${bezirkNr}").`);
  }
  return WK7_PRAEFIXE.has(praefix) ? "7" : "6";
}
