import { matchesParitaet } from "../shared/paritaet.js";
import type { Bereich, Strasse } from "../shared/types.js";

export type Ergebnis =
  | { art: "eindeutig"; wk: string }
  | { art: "uebersicht"; bereiche: Bereich[] }
  | { art: "treffer"; wk: string }
  | { art: "vermutung"; vermutung: string; grund: string }
  | { art: "kein-treffer"; bereiche: Bereich[] };

export function ergebnisFuer(strasse: Strasse, nummer: number | null): Ergebnis {
  if ("wk" in strasse) {
    return { art: "eindeutig", wk: strasse.wk };
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
