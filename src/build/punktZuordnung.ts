import type { BuchstabenAdresse } from "./buchstabenPruefung.js";
import { findePolygon, type BenanntesPolygon, type Punkt } from "./geo.js";

export interface AdressPunkt {
  strasse: string;
  hausnummer: number;
  suffix: string;
  punkt: Punkt;
}

interface HausnummerEintrag {
  wk: string;
  istUnbuchstabiert: boolean;
}

export interface ZuordnungsErgebnis {
  byStrasse: Map<string, Map<number, string>>;
  ohneTreffer: number;
  mehrdeutig: number;
  /** Adressen mit Buchstabenzusatz und ihrem berechneten Wahlkreis (für die Buchstaben-Prüfung). */
  buchstabenAdressen: BuchstabenAdresse[];
}

/**
 * Ordnet Adresspunkte per Punkt-in-Polygon-Abgleich einem Wahlkreis zu
 * (über `wahlkreisFuer`, das aus dem Namen des treffenden Polygons - z.B.
 * Kommunalwahlbezirk- oder Stadtteil-Nummer - den Wahlkreis ableitet).
 *
 * Bei widersprüchlichen buchstabierten Varianten derselben Hausnummer (z.B.
 * "Hermannshöhe 5" und "5b" in unterschiedlichen Polygonen) gilt die
 * unbuchstabierte Zeile als maßgeblich, sofern vorhanden - unser
 * Datenmodell kennt bei Einzeladressen keinen Buchstabenzusatz. Etabliert
 * bei Bochum, seither für jede berechnete Stadt (Bielefeld, Aachen,
 * Wuppertal, Marl, ...) wiederverwendet.
 */
export function ordneAdressenZu(
  punkte: AdressPunkt[],
  polygone: BenanntesPolygon[],
  wahlkreisFuer: (polygonName: string) => string,
): ZuordnungsErgebnis {
  const byStrasse = new Map<string, Map<number, HausnummerEintrag>>();
  let ohneTreffer = 0;
  let mehrdeutig = 0;
  const buchstabenAdressen: BuchstabenAdresse[] = [];

  for (const p of punkte) {
    const treffer = findePolygon(p.punkt, polygone);
    if (treffer.length === 0) {
      ohneTreffer++;
      continue;
    }
    if (treffer.length > 1) {
      mehrdeutig++;
      continue;
    }
    const wk = wahlkreisFuer(treffer[0]!);
    const istUnbuchstabiert = p.suffix === "";
    if (!istUnbuchstabiert) {
      buchstabenAdressen.push({ strasse: p.strasse, nummer: p.hausnummer, zusatz: p.suffix.toLowerCase(), wk });
    }
    const hausnummern = byStrasse.get(p.strasse) ?? new Map<number, HausnummerEintrag>();
    byStrasse.set(p.strasse, hausnummern);

    const bisherige = hausnummern.get(p.hausnummer);
    if (bisherige === undefined || (istUnbuchstabiert && !bisherige.istUnbuchstabiert)) {
      hausnummern.set(p.hausnummer, { wk, istUnbuchstabiert });
    }
  }

  const ergebnis = new Map<string, Map<number, string>>();
  for (const [strasse, hausnummern] of byStrasse) {
    const flach = new Map<number, string>();
    for (const [hnr, eintrag] of hausnummern) flach.set(hnr, eintrag.wk);
    ergebnis.set(strasse, flach);
  }
  return { byStrasse: ergebnis, ohneTreffer, mehrdeutig, buchstabenAdressen };
}
