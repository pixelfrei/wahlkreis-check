import type { Bereich, Strasse } from "../shared/types.js";
import { computeVermutung } from "./vermutung.js";

export class BuildError extends Error {}

export interface RohZeile {
  von: number | null;
  bis: number | null;
  par: Bereich["par"] | null;
  wk: string | null;
  /** Grenzen mit Buchstabenzusatz aus der Quelle (nur für die Buchstaben-Prüfung). */
  buchstaben?: { nummer: number; zusatz: string }[];
}

/**
 * Baut aus den rohen Zeilen einer Straße (bereits Parität-/Buchstabenzusatz-
 * bereinigt, ein Eintrag pro Bereich) den finalen Strasse-Eintrag: eindeutig,
 * wenn alle Zeilen denselben Wahlkreis tragen und keine unklar ist, sonst eine
 * Bereichsliste mit zusammengefassten angrenzenden Bereichen. Stadtunabhängig -
 * wird sowohl von Dortmund als auch von Köln verwendet.
 */
export function gruppiereZuStrasse(name: string, rows: RohZeile[]): Strasse {
  const distinctWk = new Set(
    rows.filter((r): r is RohZeile & { wk: string } => r.wk !== null).map((r) => r.wk),
  );
  const hasUnclear = rows.some((r) => r.wk === null);
  const eindeutig = distinctWk.size === 1 && !hasUnclear;

  if (eindeutig) {
    const [wk] = distinctWk;
    return { n: name, wk: wk! };
  }

  const wholeStreetRows = rows.filter((r) => r.von === null || r.bis === null);
  if (wholeStreetRows.length > 0) {
    throw new BuildError(
      `Straße "${name}" hat einen Eintrag ohne Hausnummernbereich neben widersprüchlichen Einträgen.`,
    );
  }

  const bereiche: Bereich[] = [];

  for (const r of rows) {
    if (r.wk !== null) {
      bereiche.push({ von: r.von!, bis: r.bis!, par: r.par!, wk: r.wk });
    }
  }

  for (const r of rows) {
    if (r.wk === null) {
      const vermutung = computeVermutung(bereiche, {
        von: r.von!,
        bis: r.bis!,
        par: r.par!,
      });
      bereiche.push({
        von: r.von!,
        bis: r.bis!,
        par: r.par!,
        wk: null,
        ...(vermutung ? { vermutung: vermutung.wk, grund: vermutung.grund } : {}),
      });
    }
  }

  bereiche.sort((a, b) => a.von - b.von);

  return { n: name, b: mergeAngrenzend(bereiche) };
}

/**
 * Bei manchen Städten (Düsseldorf, Hamm) bedeutet eine adresslose Zeile nur
 * "dieses Straßensegment/-teil hat keine nummerierten Adressen" - nicht wie bei
 * Dortmund/Köln "ganze Straße in diesem Wahlkreis". Gibt es für dieselbe Straße
 * auch adressierte Zeilen, sind die adresslosen für die Adresssuche irrelevant.
 */
export function entferneUeberfluessigeAdresslose(rows: RohZeile[]): RohZeile[] {
  const hatAdressierteZeilen = rows.some((r) => r.von !== null);
  return hatAdressierteZeilen ? rows.filter((r) => r.von !== null) : rows;
}

/**
 * Straßen ganz ohne Hausnummern (Brücken, Tunnel, Zubringer), die dabei mehrere
 * Wahlkreise berühren, lassen sich nicht eindeutig zuordnen - und da es keine
 * Hausnummer gibt, nach der überhaupt gesucht werden könnte, ist das für die
 * Adresssuche irrelevant. Solche Straßen werden komplett übersprungen.
 */
export function istUnaufloesbarAdresslos(rows: RohZeile[]): boolean {
  const hatAdressierteZeilen = rows.some((r) => r.von !== null);
  if (hatAdressierteZeilen) return false;
  const distinctWk = new Set(rows.map((r) => r.wk));
  return distinctWk.size > 1;
}

function mergeAngrenzend(bereiche: Bereich[]): Bereich[] {
  const result: Bereich[] = [];
  for (const b of bereiche) {
    const prev = result[result.length - 1];
    const step = b.par === "b" ? 1 : 2;
    if (
      prev &&
      prev.wk !== null &&
      b.wk === prev.wk &&
      b.par === prev.par &&
      b.von === prev.bis + step
    ) {
      prev.bis = b.bis;
    } else {
      result.push({ ...b });
    }
  }
  return result;
}
