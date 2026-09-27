import { readFile, writeFile } from "node:fs/promises";
import type { StrassenDaten } from "../shared/types.js";
import { BuildError } from "./gruppierung.js";

/**
 * Plausibilitätsprüfung beim Schreiben der Daten: Die fachlichen Prüfungen
 * (Vollscan, Buchstaben) finden Widersprüche innerhalb eines Datenstands,
 * erkennen aber nicht, wenn eine Stadt plötzlich eine halb leere Datei
 * veröffentlicht oder ihre Bezirke neu nummeriert. Deshalb wird der neue
 * Stand mit dem bisherigen verglichen: Kleinigkeiten laufen durch, größere
 * Sprünge werden gemeldet, grobe Abweichungen brechen den Build ab.
 *
 * Ist die große Änderung richtig (z.B. nach einer Gebietsreform), lässt sich
 * der Abbruch mit PLAUSIBILITAET_IGNORIEREN=1 übergehen.
 */
const GRENZEN = {
  /** Anteil entfallener Straßen */
  entfallenWarnung: 0.02,
  entfallenFehler: 0.1,
  /** Anteil neuer Straßen */
  neuWarnung: 0.1,
  neuFehler: 0.5,
  /** Anteil Straßen mit geänderter Zuordnung */
  geaendertWarnung: 0.01,
  geaendertFehler: 0.05,
};

export interface Plausibilitaet {
  vorher: number;
  nachher: number;
  neu: string[];
  entfallen: string[];
  geaendert: string[];
  warnungen: string[];
  fehler: string[];
}

function anteil(zahl: number, gesamt: number): string {
  return gesamt === 0 ? "-" : `${((zahl / gesamt) * 100).toFixed(1)} %`;
}

export function pruefePlausibilitaet(alt: StrassenDaten, neu: StrassenDaten): Plausibilitaet {
  const altNach = new Map(alt.strassen.map((s) => [s.n, JSON.stringify(s)]));
  const neuNach = new Map(neu.strassen.map((s) => [s.n, JSON.stringify(s)]));

  const entfallen = [...altNach.keys()].filter((n) => !neuNach.has(n));
  const hinzu = [...neuNach.keys()].filter((n) => !altNach.has(n));
  const geaendert = [...neuNach.entries()]
    .filter(([n, wert]) => altNach.has(n) && altNach.get(n) !== wert)
    .map(([n]) => n);

  const gesamt = alt.strassen.length;
  const warnungen: string[] = [];
  const fehler: string[] = [];

  const pruefe = (
    was: string,
    liste: string[],
    warnungsGrenze: number,
    fehlerGrenze: number,
  ): void => {
    if (liste.length === 0 || gesamt === 0) return;
    const quote = liste.length / gesamt;
    const text =
      `${liste.length} ${was} (${anteil(liste.length, gesamt)}): ` +
      liste.slice(0, 5).join(", ") +
      (liste.length > 5 ? ` ... und ${liste.length - 5} weitere` : "");
    if (quote >= fehlerGrenze) fehler.push(text);
    else if (quote >= warnungsGrenze) warnungen.push(text);
  };

  pruefe("Straßen entfallen", entfallen, GRENZEN.entfallenWarnung, GRENZEN.entfallenFehler);
  pruefe("Straßen neu", hinzu, GRENZEN.neuWarnung, GRENZEN.neuFehler);
  pruefe("Straßen geändert", geaendert, GRENZEN.geaendertWarnung, GRENZEN.geaendertFehler);

  // Ein verschwundener oder neu auftauchender Wahlkreis heißt: die Zuordnung
  // selbst hat sich geändert - das darf nie unbemerkt durchlaufen.
  const altWk = new Set(Object.keys(alt.wahlkreise));
  const neuWk = new Set(Object.keys(neu.wahlkreise));
  const fehlendeWk = [...altWk].filter((wk) => !neuWk.has(wk));
  const neueWk = [...neuWk].filter((wk) => !altWk.has(wk));
  if (fehlendeWk.length > 0) fehler.push(`Wahlkreis(e) nicht mehr vorhanden: ${fehlendeWk.join(", ")}`);
  if (neueWk.length > 0) fehler.push(`Wahlkreis(e) neu aufgetaucht: ${neueWk.join(", ")}`);

  return { vorher: gesamt, nachher: neu.strassen.length, neu: hinzu, entfallen, geaendert, warnungen, fehler };
}

async function ladeBisherigen(pfad: string): Promise<StrassenDaten | null> {
  try {
    return JSON.parse(await readFile(pfad, "utf-8")) as StrassenDaten;
  } catch {
    return null; // neue Stadt - nichts zu vergleichen
  }
}

/**
 * Schreibt die Daten einer Stadt - nach einem Vergleich mit dem bisherigen
 * Stand. Wird von allen Stadt-Aufbereitungen verwendet.
 */
export async function schreibeDaten(pfad: string, daten: StrassenDaten): Promise<void> {
  const bisher = await ladeBisherigen(pfad);
  if (bisher) {
    const bericht = pruefePlausibilitaet(bisher, daten);
    const unterschiede =
      bericht.neu.length + bericht.entfallen.length + bericht.geaendert.length === 0
        ? "keine Unterschiede"
        : `${bericht.neu.length} neu, ${bericht.entfallen.length} entfallen, ${bericht.geaendert.length} geändert`;
    console.log(`Plausibilität: ${bericht.vorher} -> ${bericht.nachher} Straßen (${unterschiede}).`);
    for (const w of bericht.warnungen) console.warn(`  WARNUNG: ${w}`);

    if (bericht.fehler.length > 0) {
      for (const f of bericht.fehler) console.error(`  UNPLAUSIBEL: ${f}`);
      if (process.env.PLAUSIBILITAET_IGNORIEREN !== "1") {
        throw new BuildError(
          `Der neue Stand weicht stark vom bisherigen ab (siehe oben). Quelle prüfen; ` +
            `ist die Änderung richtig, mit PLAUSIBILITAET_IGNORIEREN=1 erneut bauen.`,
        );
      }
      console.warn("  (übergangen wegen PLAUSIBILITAET_IGNORIEREN=1)");
    }
  }

  await writeFile(pfad, `${JSON.stringify(daten, null, 2)}\n`, "utf-8");
  console.log(`${pfad} geschrieben.`);
}
