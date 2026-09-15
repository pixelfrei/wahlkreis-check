import type { RohZeile } from "../gruppierung.js";

/**
 * Untere Grenze "Anfang" wird auf 1 abgebildet, obere Grenze "Ende" auf einen
 * praktisch unerreichbar hohen Wert - beide sind reine Platzhalter für "diese
 * Straße hat hier noch keine/keine weitere Grenze", keine echten Hausnummern.
 */
const ANFANG_HAUSNUMMER = 1;
const ENDE_HAUSNUMMER = 99999;

const BOUNDED_RE = /^(.+?)\s+(Anfang|\d+)\s*-\s*(Ende|\d+)\s+(gerade|ungerade)$/;

export interface GladbeckZeile {
  strasse: string;
  von: string | null;
  bis: string | null;
  par: "gerade" | "ungerade" | null;
}

/**
 * Eine Zeile im amtlichen Wahlbezirksverzeichnis ist entweder ein bloßer
 * Straßenname (die ganze Straße gehört zu diesem Kommunalwahlbezirk) oder
 * "Straße VON - BIS gerade/ungerade" mit VON/BIS als "Anfang"/"Ende" oder
 * einer Zahl.
 */
export function parseZeile(line: string): GladbeckZeile {
  const match = BOUNDED_RE.exec(line);
  if (!match) {
    return { strasse: line, von: null, bis: null, par: null };
  }
  const [, strasse, von, bis, par] = match;
  return { strasse: strasse!, von: von!, bis: bis!, par: par as "gerade" | "ungerade" };
}

export function gladbeckZeileZuRohZeile(zeile: GladbeckZeile, wk: string): RohZeile {
  if (zeile.von === null) {
    return { von: null, bis: null, par: null, wk };
  }
  return {
    von: zeile.von === "Anfang" ? ANFANG_HAUSNUMMER : parseInt(zeile.von, 10),
    bis: zeile.bis === "Ende" ? ENDE_HAUSNUMMER : parseInt(zeile.bis!, 10),
    par: zeile.par === "gerade" ? "g" : "u",
    wk,
  };
}
