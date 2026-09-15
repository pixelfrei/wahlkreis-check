import type { Paritaet } from "../shared/types.js";

export function zfill5(s: string): string {
  return s.padStart(5, "0");
}

export function parseHausnummer(s: string): number {
  const match = /^\d+/.exec(s);
  if (!match) {
    throw new Error(`Hausnummer ohne führende Ziffer: "${s}"`);
  }
  return parseInt(match[0], 10);
}

export function hatBuchstabenzusatz(s: string): boolean {
  return /[a-zA-Z]/.test(s);
}

export function paritaetOf(von: number, bis: number): Paritaet {
  const vonGerade = von % 2 === 0;
  const bisGerade = bis % 2 === 0;
  if (vonGerade === bisGerade) return vonGerade ? "g" : "u";
  return "b";
}
