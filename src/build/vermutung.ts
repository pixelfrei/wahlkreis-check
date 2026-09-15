import type { Bereich, Paritaet } from "../shared/types.js";

export interface Vermutung {
  wk: string;
  grund: string;
}

/**
 * Nachbarschaftsregel: nur wenn der nächstniedrigere und der nächsthöhere
 * Bereich derselben Straßenseite existieren und denselben Wahlkreis tragen.
 * Niemals über die Straßenseite hinweg oder von nur einer Seite aus.
 */
export function computeVermutung(
  bereiche: Bereich[],
  unklar: { von: number; bis: number; par: Paritaet },
): Vermutung | null {
  const relevant = bereiche.filter(
    (b) => b.wk !== null && (b.par === unklar.par || b.par === "b"),
  );

  let lower: Bereich | null = null;
  let higher: Bereich | null = null;

  for (const b of relevant) {
    if (b.bis < unklar.von && (!lower || b.bis > lower.bis)) lower = b;
    if (b.von > unklar.bis && (!higher || b.von < higher.von)) higher = b;
  }

  if (!lower || !higher || lower.wk !== higher.wk) return null;

  return {
    wk: lower.wk!,
    grund: `Nachbarbereiche ${lower.von}-${lower.bis} und ${higher.von}-${higher.bis} in ${lower.wk}`,
  };
}
