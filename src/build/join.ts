import type { Strasse, StrassenverzeichnisRecord, WahlraumRecord } from "../shared/types.js";
import {
  buchstabenAusZeilen,
  buchstabenGrenzen,
  zusatzVon,
  type BuchstabenAdresse,
} from "./buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "./gruppierung.js";
import { hatBuchstabenzusatz, parseHausnummer, paritaetOf, zfill5 } from "./parse.js";

export { BuildError };

export interface JoinResult {
  strassen: Strasse[];
  wahlkreise: Record<string, string>;
  zeilenOhneStimmbezirk: { strasse: string; hausnummernbereich: string | null }[];
  buchstabenAdressen: BuchstabenAdresse[];
}

export function buildStrassen(
  strassenRows: StrassenverzeichnisRecord[],
  wahlraumRows: WahlraumRecord[],
): JoinResult {
  const lookup = new Map<string, { nr: string; name: string }>();
  for (const row of wahlraumRows) {
    lookup.set(zfill5(row.stimmbezirk), {
      nr: row.landtagswahlkreis_nr,
      // landtagswahlkreis kommt as "111 Dortmund I" - die Nummer ist bereits
      // der Objekt-Key in wahlkreise, hier soll nur der Name stehen.
      name: row.landtagswahlkreis.replace(/^\d+\s+/, ""),
    });
  }

  const wahlkreise: Record<string, string> = {};
  for (const { nr, name } of lookup.values()) {
    wahlkreise[nr] = name;
  }

  const zeilenOhneStimmbezirk: JoinResult["zeilenOhneStimmbezirk"] = [];
  const byStrasse = new Map<string, RohZeile[]>();

  for (const row of strassenRows) {
    let wk: string | null;
    if (row.stimmbezirk === null) {
      zeilenOhneStimmbezirk.push({
        strasse: row.strasse,
        hausnummernbereich: row.hausnummernbereich,
      });
      wk = null;
    } else {
      const key = zfill5(row.stimmbezirk);
      const eintrag = lookup.get(key);
      if (!eintrag) {
        throw new BuildError(
          `Stimmbezirk ${key} (Straße "${row.strasse}") fehlt im Wahlraumverzeichnis.`,
        );
      }
      wk = eintrag.nr;
    }

    // Trägt hausnummer_von einen Buchstabenzusatz (z.B. "015b"), gehört die reine
    // Basisnummer (15) bereits zum vorherigen Bereich (der bis "015a" reicht) -
    // dieser Bereich beginnt also erst bei der nächsten Nummer derselben Seite.
    // hausnummer_bis mit Zusatz braucht keine Anpassung, die Basisnummer bleibt
    // dort ohnehin eingeschlossen.
    const vonBasis =
      row.hausnummer_von === null ? null : parseHausnummer(row.hausnummer_von);
    const bis = row.hausnummer_bis === null ? null : parseHausnummer(row.hausnummer_bis);
    const par = vonBasis !== null && bis !== null ? paritaetOf(vonBasis, bis) : null;
    const von =
      vonBasis !== null && row.hausnummer_von !== null && hatBuchstabenzusatz(row.hausnummer_von)
        ? vonBasis + 1
        : vonBasis;

    const list = byStrasse.get(row.strasse) ?? [];
    const buchstaben = buchstabenGrenzen(
      vonBasis !== null ? { nummer: vonBasis, zusatz: zusatzVon(row.hausnummer_von ?? "") } : null,
      bis !== null ? { nummer: bis, zusatz: zusatzVon(row.hausnummer_bis ?? "") } : null,
      bis !== null && vonBasis !== bis,
    );
    list.push({ von, bis, par, wk, ...(buchstaben && { buchstaben }) });
    byStrasse.set(row.strasse, list);
  }

  const strassen: Strasse[] = [];
  for (const [name, rows] of byStrasse) {
    strassen.push(gruppiereZuStrasse(name, rows));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));

  return { strassen, wahlkreise, zeilenOhneStimmbezirk, buchstabenAdressen: buchstabenAusZeilen(byStrasse) };
}
