import { buchstabenGrenzen } from "../buchstabenPruefung.js";
import { BuildError, type RohZeile } from "../gruppierung.js";

const RANGE_RE =
  /^(\d+)(?:\s+([A-Za-z]))?\s*-\s*(\d+)(?:\s+([A-Za-z]))?(?:\s+(gerade|ungerade))?$/;
const SINGLE_RE = /^(\d+)(?:\s+([A-Za-z]))?$/;

/**
 * Mettmanns Hausnummernbereiche stehen als freier Text, aber anders als bei
 * Mülheim/Kerpen: ein Buchstabenzusatz steht als eigenes, durch Leerzeichen
 * getrenntes Token ("1 A" statt "1A"), es gibt keine kommagetrennten
 * Mehrfachsegmente (jede Zeile trägt genau einen Bereich), und "alle" markiert
 * explizit die ganze Straße statt einer leeren Zelle. Fehlt der Paritäts-
 * Hinweis bei einem Bereich, deckt er - wie bei Mülheim/Kerpen - BEIDE
 * Paritäten ab ("b").
 *
 * Ein Buchstabenzusatz an der UNTEREN Grenze eines Bereichs verschiebt die
 * Basisnummer um eins (siehe src/build/parse.ts); an der oberen Grenze oder
 * bei einer einzelnen Hausnummer (kein Bereich) bleibt sie unverändert.
 */
export function parseHausnummernBereich(bereich: string, wk: string): RohZeile {
  const text = bereich.trim();
  if (text === "alle") {
    return { von: null, bis: null, par: null, wk };
  }

  const rangeMatch = RANGE_RE.exec(text);
  if (rangeMatch) {
    const [, vonBasisStr, vonZusatz, bisStr, bisZusatz, paritaet] = rangeMatch;
    const vonBasis = parseInt(vonBasisStr!, 10);
    const von = vonZusatz ? vonBasis + 1 : vonBasis;
    const bis = parseInt(bisStr!, 10);
    const par = paritaet === "gerade" ? "g" : paritaet === "ungerade" ? "u" : "b";
    const buchstaben = buchstabenGrenzen(
      { nummer: vonBasis, zusatz: vonZusatz },
      { nummer: bis, zusatz: bisZusatz },
      true,
    );
    return { von, bis, par, wk, ...(buchstaben && { buchstaben }) };
  }

  const singleMatch = SINGLE_RE.exec(text);
  if (singleMatch) {
    const basis = parseInt(singleMatch[1]!, 10);
    const buchstaben = buchstabenGrenzen({ nummer: basis, zusatz: singleMatch[2] }, null, false);
    return { von: basis, bis: basis, par: "b", wk, ...(buchstaben && { buchstaben }) };
  }

  throw new BuildError(`Unbekannter Hausnummernbereich: "${bereich}"`);
}
