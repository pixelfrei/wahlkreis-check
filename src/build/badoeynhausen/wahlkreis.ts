import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: von Bad Oeynhausen
 * gehen die Stadtteile Bad Oeynhausen (Kernstadt), Lohe und Rehme an
 * Wahlkreis 89 ("Minden-Lübbecke II"). Die übrigen Stadtteile (Dehme,
 * Eidinghausen, Werste, Volmerdingsen, Wulferdingsen) bilden Wahlkreis 91
 * ("Herford II - Minden-Lübbecke III"). Der Vote-Manager-Datensatz kennt nur
 * Wahlbezirk-Nummern ("Bezirk-Nr") - laut opendata-wahllokale.csv liegen die
 * Wahlbezirke 010-110 (Lohe/Bad Oeynhausen/Rehme) in Wahlkreis 89, die
 * Wahlbezirke 120-220 (Dehme/Eidinghausen/Werste/Volmerdingsen/
 * Wulferdingsen) in Wahlkreis 91 - die Grenze verläuft exakt zwischen 110 und
 * 120, es gibt keine Überschneidung.
 */
const WK89_MAX_BEZIRK = 110;

export function wahlkreisFuer(bezirkNr: string): string {
  const nr = parseInt(bezirkNr, 10);
  if (Number.isNaN(nr) || nr < 10 || nr > 220) {
    throw new BuildError(`Unbekannte Bezirk-Nr "${bezirkNr}".`);
  }
  return nr <= WK89_MAX_BEZIRK ? "89" : "91";
}
