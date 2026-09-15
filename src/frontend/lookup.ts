import { matchesParitaet } from "../shared/paritaet.js";
import type { Bereich, BuchstabenAusnahme, Strasse } from "../shared/types.js";

export type Ergebnis =
  | { art: "eindeutig"; wk: string }
  | { art: "uebersicht"; bereiche: Bereich[] }
  | { art: "treffer"; wk: string }
  | { art: "vermutung"; vermutung: string; grund: string }
  | { art: "kein-treffer"; bereiche: Bereich[] };

/**
 * Ob für diese Straße eine Hausnummer nötig ist: bei geteilten Straßen und bei
 * Straßen, in denen einzelne Hausnummern mit Buchstaben woanders liegen.
 */
export function brauchtHausnummer(strasse: Strasse): boolean {
  return "b" in strasse || (strasse.z?.length ?? 0) > 0;
}

/** Die passende Buchstaben-Ausnahme; bei mehreren gewinnt die engste (einzelne Adresse vor "ab"). */
export function ausnahmeFuer(
  strasse: Strasse,
  nummer: number,
  zusatz: string,
): BuchstabenAusnahme | undefined {
  const buchstabe = /^[a-z]+/.exec(zusatz.trim().toLowerCase())?.[0];
  if (!buchstabe || !strasse.z) return undefined;
  const spanne = (a: BuchstabenAusnahme) => a.bis.charCodeAt(0) - a.von.charCodeAt(0);
  return strasse.z
    .filter((a) => a.nr === nummer && a.von <= buchstabe && buchstabe <= a.bis)
    .sort((a, b) => spanne(a) - spanne(b))[0];
}

export function ergebnisFuer(strasse: Strasse, nummer: number | null, zusatz = ""): Ergebnis {
  if (nummer !== null) {
    const ausnahme = ausnahmeFuer(strasse, nummer, zusatz);
    if (ausnahme) return { art: "treffer", wk: ausnahme.wk };
  }

  if ("wk" in strasse) {
    if (!brauchtHausnummer(strasse)) return { art: "eindeutig", wk: strasse.wk };
    return nummer === null ? { art: "uebersicht", bereiche: [] } : { art: "treffer", wk: strasse.wk };
  }

  if (nummer === null) {
    return { art: "uebersicht", bereiche: strasse.b };
  }

  const treffer = strasse.b.find(
    (b) => b.von <= nummer && nummer <= b.bis && matchesParitaet(b.par, nummer),
  );

  if (!treffer) {
    return { art: "kein-treffer", bereiche: strasse.b };
  }

  if (treffer.wk === null) {
    return {
      art: "vermutung",
      vermutung: treffer.vermutung ?? "",
      grund: treffer.grund ?? "",
    };
  }

  return { art: "treffer", wk: treffer.wk };
}
