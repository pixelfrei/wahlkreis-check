import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Wahlkreis 1
 * ("Aachen I") umfasst die kompletten Stadtbezirke Laurensberg, Richterich
 * und Haaren, dazu vom Stadtbezirk Mitte nur die Stadtteile 10, 13-18,
 * 21-25, 34, 47, 48. Wahlkreis 2 ("Aachen II") umfasst die kompletten
 * Stadtbezirke Kornelimünster/Walheim, Brand und Eilendorf, dazu vom
 * Stadtbezirk Mitte nur die Stadtteile 31-33, 35-37, 41-43, 46.
 *
 * Die Stadtteil-Nummer jeder Stimmbezirk-Nummer (Feld "st_nr" im
 * WFS-Layer) ergibt sich aus den ersten zwei Ziffern (z.B. "1604" ->
 * Stadtteil 16 "Hanbruch") - amtlich verifiziert über die Ratsvorlage FB
 * 01/0619/WP18 (Einteilung des Wahlgebietes in Wahlbezirke für die
 * Kommunalwahl 2025).
 *
 * Aachen-Mitte hat 25 Stadtteile (10-48, s.o.), die übrigen sechs
 * Stadtbezirke zusammen 9 weitere (51-53, 61-66) - zusammen alle 34
 * Stadtteile Aachens, vollständig abgedeckt (verifiziert: die im
 * WFS-Layer tatsächlich vorkommenden 34 Stadtteil-Nummern entsprechen
 * exakt der Vereinigung beider Listen unten, keine Lücke, keine
 * Überschneidung).
 *
 * ACHTUNG: die Kommunalwahlbezirk-Gruppierung (Name) folgt NICHT immer
 * denselben Stadtteil-Grenzen wie die Anlage - Kommunalwahlbezirk 12
 * "Rothe Erde/Panneschopp" z.B. enthält sowohl Stimmbezirke aus Stadtteil
 * 34 (Rothe Erde, hier WK1) als auch aus Stadtteil 33 (Panneschopp, hier
 * WK2). Deshalb wird hier ausschließlich über die Stadtteil-Nummer
 * (aus der Stimmbezirk-Nummer), nie über den Kommunalwahlbezirk-Namen
 * zugeordnet.
 */
const WK1_STADTTEILE = new Set([
  10, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 34, 47, 48, 53, 64, 65, 66,
]);
const WK2_STADTTEILE = new Set([31, 32, 33, 35, 36, 37, 41, 42, 43, 46, 51, 52, 61, 62, 63]);

export function wahlkreisFuerStadtteil(stadtteil: number): string {
  if (WK1_STADTTEILE.has(stadtteil)) return "1";
  if (WK2_STADTTEILE.has(stadtteil)) return "2";
  throw new BuildError(`Unbekannter Stadtteil "${stadtteil}".`);
}

export function stadtteilAusStimmbezirk(stNr: string): number {
  return Math.floor(parseInt(stNr, 10) / 100);
}
