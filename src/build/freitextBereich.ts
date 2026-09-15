import { BuildError, type RohZeile } from "./gruppierung.js";

const SEGMENT_RE = /^(\d+)([a-zA-Z]?)(?:-(\d+)([a-zA-Z]?))?\s*(ger\.|ung\.)?$/;

/**
 * Manche Vote-Manager-Städte (Mülheim, Kerpen) tragen Hausnummernbereiche als
 * freien Text in einer einzelnen Spalte, kommagetrennt in Segmente. Ein
 * Segment ist entweder eine einzelne Hausnummer ("94" oder "16A") oder ein
 * Bereich ("2-24"), optional mit Paritäts-Hinweis ("ger."/"ung."). Fehlt der
 * Hinweis, deckt das Segment BEIDE Paritäten ab (typischerweise der Anfang
 * einer Straße, bevor sie sich auf mehrere Bezirke aufteilt) - dafür gibt es
 * "b" in Bereich.par. Eine leere Zelle bedeutet: die ganze Straße gehört zu
 * diesem Bezirk (wie bei Dortmund/Köln - hier vorher prüfen, dass keine
 * Straße sowohl leere als auch befüllte Zeilen hat, siehe Düsseldorf/Hamm für
 * das andere Konfliktmuster).
 *
 * Ein Buchstabenzusatz an der UNTEREN Grenze EINES BEREICHS verschiebt die
 * Basisnummer wie bei Dortmund/Köln/Hamm um eins (siehe src/build/parse.ts) -
 * z.B. gehört bei "94A-123" die Basisnummer 94 noch zum vorherigen Bezirk,
 * dieser beginnt erst bei 95. Ein Zusatz an der oberen Grenze braucht keine
 * Anpassung. Eine einzelne Hausnummer (kein Bereich, z.B. "89A" oder "2A")
 * ist dagegen ein eigenständiger Punkt, keine Bereichsgrenze - hier bleibt
 * die Basisnummer unverändert.
 */
export function parseHausnummernBereich(bereich: string, wk: string): RohZeile[] {
  const text = bereich.trim();
  if (text === "") {
    return [{ von: null, bis: null, par: null, wk }];
  }

  return text.split(",").map((segment) => parseSegment(segment.trim(), wk));
}

function parseSegment(segment: string, wk: string): RohZeile {
  const match = SEGMENT_RE.exec(segment);
  if (!match) {
    throw new BuildError(`Unbekanntes Hausnummern-Segment: "${segment}"`);
  }
  const [, vonBasisStr, vonZusatz, bisStr, , qualifier] = match;

  const vonBasis = parseInt(vonBasisStr!, 10);
  const istBereich = bisStr !== undefined;
  const von = istBereich && vonZusatz ? vonBasis + 1 : vonBasis;
  const bis = istBereich ? parseInt(bisStr, 10) : vonBasis;
  const par = qualifier === "ger." ? "g" : qualifier === "ung." ? "u" : "b";

  return { von, bis, par, wk };
}
