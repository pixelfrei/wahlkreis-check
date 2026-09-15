import type { Paritaet } from "./types.js";

/** Prüft, ob eine Hausnummer zur Seite (gerade/ungerade/beide) eines Bereichs passt. */
export function matchesParitaet(par: Paritaet, n: number): boolean {
  if (par === "b") return true;
  const gerade = n % 2 === 0;
  return par === "g" ? gerade : !gerade;
}
