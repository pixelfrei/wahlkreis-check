import { matchesParitaet } from "../shared/paritaet.js";
import type { Strasse } from "../shared/types.js";

export function checkWahlkreisCount(wahlkreise: Record<string, string>, erwartet: number): void {
  const count = Object.keys(wahlkreise).length;
  if (count !== erwartet) {
    throw new Error(
      `Erwartet ${erwartet} Wahlkreise, gefunden ${count}: ${Object.keys(wahlkreise).join(", ")}`,
    );
  }
}

export interface VollscanConflict {
  strasse: string;
  hausnummer: number;
  wks: string[];
}

export function runVollscan(strassen: Strasse[]): VollscanConflict[] {
  const conflicts: VollscanConflict[] = [];

  for (const s of strassen) {
    if (!("b" in s) || s.b.length === 0) continue;

    const min = Math.min(...s.b.map((b) => b.von));
    const max = Math.max(...s.b.map((b) => b.bis));

    for (let n = min; n <= max; n++) {
      const treffer = s.b.filter(
        (b) => b.wk !== null && b.von <= n && n <= b.bis && matchesParitaet(b.par, n),
      );
      const wks = new Set(treffer.map((b) => b.wk as string));
      if (wks.size > 1) {
        conflicts.push({ strasse: s.n, hausnummer: n, wks: [...wks] });
      }
    }
  }

  return conflicts;
}

export interface GapWarning {
  strasse: string;
  von: number;
  bis: number;
}

const STEP = 2;

export function findGaps(strassen: Strasse[]): GapWarning[] {
  const warnings: GapWarning[] = [];

  for (const s of strassen) {
    if (!("b" in s)) continue;

    for (const lane of ["g", "u"] as const) {
      const relevant = s.b
        .filter((b) => b.par === lane || b.par === "b")
        .slice()
        .sort((a, b) => a.von - b.von);

      for (let i = 1; i < relevant.length; i++) {
        const prev = relevant[i - 1]!;
        const cur = relevant[i]!;
        if (cur.von > prev.bis + STEP) {
          warnings.push({ strasse: s.n, von: prev.bis + STEP, bis: cur.von - STEP });
        }
      }
    }
  }

  return warnings;
}
