import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: die Wahlkreisgrenzen in
 * Düsseldorf folgen den Stadtbezirken - mit Ausnahme der Bezirke 6 und 8, die
 * zusätzlich nach Stadtteil zwischen zwei Wahlkreisen aufgeteilt sind.
 */
const GANZE_BEZIRKE: Record<string, string> = {
  "01": "41",
  "05": "41",
  "02": "42",
  "07": "42",
  "03": "43",
  "04": "43",
  "09": "44",
  "10": "44",
};

const GETEILTE_BEZIRKE: Record<string, Record<string, string>> = {
  "06": { Lichtenbroich: "41", Unterrath: "41", Mörsenbroich: "41", Rath: "42" },
  "08": { Lierenfeld: "42", Eller: "42", Vennhausen: "44", Unterbach: "44" },
};

export function wahlkreisFuer(stadtbezirk: string, stadtteilname: string): string {
  const geteilterBezirk = GETEILTE_BEZIRKE[stadtbezirk];
  if (geteilterBezirk) {
    const wk = geteilterBezirk[stadtteilname];
    if (!wk) {
      throw new BuildError(
        `Unbekannter Stadtteil "${stadtteilname}" in geteiltem Stadtbezirk ${stadtbezirk}.`,
      );
    }
    return wk;
  }

  const wk = GANZE_BEZIRKE[stadtbezirk];
  if (!wk) {
    throw new BuildError(`Unbekannter Stadtbezirk "${stadtbezirk}".`);
  }
  return wk;
}
