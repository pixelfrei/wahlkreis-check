// Windows-1252 belegt 0x80-0x9F mit typografischen Zeichen statt Steuerzeichen.
const CP1252_SONDERZEICHEN: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86,
  0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
  0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95,
  0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
  0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

/**
 * Essens Straßenverzeichnis ist doppelt kodiert: UTF-8-Text wurde als
 * Windows-1252 gelesen und erneut als UTF-8 gespeichert ("Ã¼" statt "ü",
 * "Ã„" statt "Ä"). Kehrt das um - lässt den Text unverändert, wenn er sich
 * nicht vollständig als doppelt kodiertes UTF-8 zurückverwandeln lässt.
 */
export function repariereDoppelteKodierung(text: string): string {
  if (!/[ÃÂ]/.test(text)) return text;
  const bytes: number[] = [];
  for (const zeichen of text) {
    const code = zeichen.codePointAt(0)!;
    const byte = code < 0x100 ? code : CP1252_SONDERZEICHEN[code];
    if (byte === undefined) return text;
    bytes.push(byte);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    return text;
  }
}

const MONAT_ZU_NUMMER: Record<string, number> = {
  Jan: 1, Feb: 2, Mrz: 3, Apr: 4, Mai: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Okt: 10, Nov: 11, Dez: 12,
};
const MONATE = Object.keys(MONAT_ZU_NUMMER).join("|");

const MONAT_ZUERST_RE = new RegExp(`^(${MONATE})\\s+(\\d+)$`);
const TAG_ZUERST_RE = new RegExp(`^(\\d+)\\.\\s*(${MONATE})$`);

/**
 * Essens Straßenverzeichnis wurde offenbar zwischenzeitlich in Excel
 * geöffnet und dabei automatisch "umformatiert": ein Hausnummernbereich wie
 * "1-24" oder "1-10", bei dem (mindestens) eine der beiden Zahlen wie ein
 * Monat (1-12) aussieht, wird von Excels Datumserkennung in ein Datum
 * verwandelt und als Text wie "Jan 24" oder "01. Okt" wieder ausgegeben -
 * abhängig davon, welche der beiden Zahlen als Monat erkannt wurde, in
 * unterschiedlicher Reihenfolge formatiert. In beiden Fällen bleibt aber die
 * ursprüngliche Lesereihenfolge (von, dann bis) erhalten: bei "Jan 24" ist
 * "Jan" (= 1) die untere und "24" die obere Grenze; bei "01. Okt" ist "01"
 * die untere und "Okt" (= 10) die obere Grenze. Betrifft nur Fälle, bei denen
 * ausschließlich eine einzelne Zahl (kein Bereich mit Buchstabenzusatz)
 * betroffen war - Bereiche mit Zusatz oder außerhalb 1-12 blieben unverändert
 * numerisch und brauchen diese Behandlung nicht.
 */
export function entmangleDatumsSegment(segment: string): string {
  const monatZuerst = MONAT_ZUERST_RE.exec(segment);
  if (monatZuerst) {
    return `${MONAT_ZU_NUMMER[monatZuerst[1]!]}-${monatZuerst[2]}`;
  }

  const tagZuerst = TAG_ZUERST_RE.exec(segment);
  if (tagZuerst) {
    return `${parseInt(tagZuerst[1]!, 10)}-${MONAT_ZU_NUMMER[tagZuerst[2]!]}`;
  }

  return segment;
}

export function entmangleBereich(bereich: string): string {
  if (bereich.trim() === "") return bereich;
  return bereich
    .split(",")
    .map((segment) => entmangleDatumsSegment(segment.trim()))
    .join(",");
}
