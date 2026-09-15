import type { Strasse } from "../../shared/types.js";
import type { RohZeile } from "../gruppierung.js";

export interface DuisburgZeile {
  strschl: string;
  strasse: string;
  stadtbezirk: string;
  hausnummer: number;
  wk: string;
}

/**
 * Duisburg liefert eine Zeile pro tatsächlicher Hausnummer (nicht als Bereich).
 * Verschiedene Buchstabenzusätze (Zusatz-Spalte) an derselben Basisnummer sind
 * im Quelldatensatz immer demselben Wahlkreis zugeordnet - für die Bereichsbildung
 * zählt daher nur die Basisnummer, der Zusatz wird ignoriert.
 *
 * Nummern werden zu zusammenhängenden Bereichen gleicher Parität und gleichen
 * Wahlkreises zusammengefasst (kleinstmögliche Darstellung).
 */
export function komprimiereZuBereichen(
  eintraege: { hausnummer: number; wk: string }[],
): RohZeile[] {
  const wkProNummer = new Map<number, string>();
  for (const e of eintraege) {
    wkProNummer.set(e.hausnummer, e.wk);
  }

  const ergebnis: RohZeile[] = [];

  for (const par of ["g", "u"] as const) {
    const nummern = [...wkProNummer.keys()]
      .filter((n) => (par === "g" ? n % 2 === 0 : n % 2 !== 0))
      .sort((a, b) => a - b);

    let von: number | null = null;
    let bis: number | null = null;
    let wk: string | null = null;

    for (const n of nummern) {
      const aktuellerWk = wkProNummer.get(n)!;
      if (von !== null && bis === n - 2 && wk === aktuellerWk) {
        bis = n;
      } else {
        if (von !== null) ergebnis.push({ von, bis: bis!, par, wk });
        von = n;
        bis = n;
        wk = aktuellerWk;
      }
    }
    if (von !== null) ergebnis.push({ von, bis: bis!, par, wk: wk! });
  }

  ergebnis.sort((a, b) => a.von! - b.von!);
  return ergebnis;
}

interface PhysischeStrasse {
  strschl: string;
  name: string;
  stadtbezirk: string;
  ergebnis: Strasse;
}

function eindeutigerWk(s: Strasse): string | null {
  return "wk" in s ? s.wk : null;
}

/**
 * Duisburg disambiguiert gleichnamige, aber physisch verschiedene Straßen in
 * unterschiedlichen Stadtteilen NICHT im Namen (anders als Köln). Tragen alle
 * gleichnamigen Straßen denselben (eindeutigen) Wahlkreis, macht das nichts -
 * sie werden zu einem Eintrag zusammengefasst. Widersprechen sie sich, wird der
 * Name um den Stadtbezirk ergänzt, um die App-Suche nicht falsch zu machen.
 */
export function benenneMehrdeutigeNamen(strassen: PhysischeStrasse[]): Strasse[] {
  const byName = new Map<string, PhysischeStrasse[]>();
  for (const s of strassen) {
    const liste = byName.get(s.name) ?? [];
    liste.push(s);
    byName.set(s.name, liste);
  }

  const ergebnis: Strasse[] = [];

  for (const [name, gruppe] of byName) {
    if (gruppe.length === 1) {
      ergebnis.push({ ...gruppe[0]!.ergebnis, n: name });
      continue;
    }

    const wks = new Set(gruppe.map((g) => eindeutigerWk(g.ergebnis)));
    if (wks.size === 1 && ![...wks].includes(null)) {
      ergebnis.push({ n: name, wk: [...wks][0]! });
      continue;
    }

    const byBezirk = new Map<string, PhysischeStrasse[]>();
    for (const g of gruppe) {
      const liste = byBezirk.get(g.stadtbezirk) ?? [];
      liste.push(g);
      byBezirk.set(g.stadtbezirk, liste);
    }

    for (const [bezirk, teil] of byBezirk) {
      const bezName = `${name} (${bezirk})`;
      if (teil.length === 1) {
        ergebnis.push({ ...teil[0]!.ergebnis, n: bezName });
        continue;
      }
      const teilWks = new Set(teil.map((g) => eindeutigerWk(g.ergebnis)));
      if (teilWks.size === 1 && ![...teilWks].includes(null)) {
        ergebnis.push({ n: bezName, wk: [...teilWks][0]! });
      } else {
        for (const g of teil) {
          ergebnis.push({ ...g.ergebnis, n: `${name} (${bezirk}, ${g.strschl})` });
        }
      }
    }
  }

  return ergebnis;
}

export type { PhysischeStrasse };
