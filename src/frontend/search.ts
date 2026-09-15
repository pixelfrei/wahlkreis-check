import type { GemeindeEintrag, Strasse } from "../shared/types.js";

/**
 * Normalisiert einen Straßennamen oder Suchbegriff für den Vergleich:
 * Kleinschreibung, Umlaute/ß aufgelöst, Leerzeichen/Bindestriche entfernt,
 * "straße"/"strasse"/"str."/"str" auf eine gemeinsame Form gebracht.
 */
export function normalize(input: string): string {
  let s = input.toLowerCase().trim();
  s = s
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue");
  s = s.replace(/[-\s]/g, "");
  s = s.replace(/\.$/, "");
  s = s.replace(/strasse$/, "str");
  return s;
}

/**
 * Sucht Einträge nach normalisiertem Präfix- und Teiltreffer, Präfix zuerst.
 * items muss bereits alphabetisch sortiert sein.
 */
export function searchByName<T>(query: string, items: T[], nameOf: (item: T) => string): T[] {
  const q = normalize(query);
  if (q.length === 0) return [];

  const prefixMatches: T[] = [];
  const substringMatches: T[] = [];

  for (const item of items) {
    const n = normalize(nameOf(item));
    if (n.startsWith(q)) {
      prefixMatches.push(item);
    } else if (n.includes(q)) {
      substringMatches.push(item);
    }
  }

  return [...prefixMatches, ...substringMatches];
}

export function searchStrassen(query: string, strassen: Strasse[]): Strasse[] {
  return searchByName(query, strassen, (s) => s.n);
}

export function searchGemeinden(query: string, gemeinden: GemeindeEintrag[]): GemeindeEintrag[] {
  return searchByName(query, gemeinden, (g) => g.name);
}
