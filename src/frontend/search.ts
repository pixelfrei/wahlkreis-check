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
 * Vereinheitlichung für die Suche. Zusätzlich zu normalize():
 * - Punkte fallen weg, auch mitten im Namen ("Dr.-Hahn-Str." = "Dr Hahn Str")
 * - "straße" wird überall zu "str", nicht nur am Ende ("Bickestraße I" = "Bickestr I")
 * - "Sankt" gilt wie "St." ("Sankt-Vither-Straße" = "St.-Vither-Strasse")
 *
 * normalize() selbst bleibt unverändert, weil daraus auch die Adressen der
 * Städte entstehen (z.B. /sanktaugustin).
 */
export function normalizeSuche(input: string): string {
  return normalize(input)
    .replace(/\./g, "")
    .replace(/strasse/g, "str")
    .replace(/sankt/g, "st");
}

/**
 * Sucht Einträge nach normalisiertem Präfix- und Teiltreffer, Präfix zuerst.
 * items muss bereits alphabetisch sortiert sein.
 */
export function searchByName<T>(query: string, items: T[], nameOf: (item: T) => string): T[] {
  const q = normalizeSuche(query);
  if (q.length === 0) return [];

  const prefixMatches: T[] = [];
  const substringMatches: T[] = [];

  for (const item of items) {
    const n = normalizeSuche(nameOf(item));
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

/**
 * Zusätzliche Vereinheitlichung nur für die fehlertolerante Suche: ein
 * verschriebenes "straße" am Ende ("strase", "strasze", "straasse") zählt wie
 * "str". Sonst würde der Tippfehler ausgerechnet im häufigsten Wortteil
 * übersehen. Für die normale Suche bleibt normalize() unverändert, damit sich
 * an Treffern und Adressen nichts ändert.
 */
function normalizeUnscharf(input: string): string {
  return normalizeSuche(input).replace(/(.)str[a-z]*$/, "$1str");
}

/**
 * Wie viele Tippfehler bei einer Eingabe dieser Länge toleriert werden.
 * Kurze Eingaben bleiben streng, sonst wird die Liste beliebig.
 */
function erlaubteFehler(laenge: number): number {
  if (laenge < 4) return 0;
  if (laenge < 8) return 1;
  return 2;
}

/**
 * Abstand zwischen `eingabe` und dem am besten passenden Anfang von `name`
 * (Levenshtein: eingefügte, fehlende und vertauschte Zeichen zählen je eins;
 * was im Namen hinten übersteht, kostet nichts). So findet "ruetenscheider"
 * auch "ruettenscheiderstr". Bricht ab, sobald `limit` überschritten ist -
 * dann ist der Rückgabewert größer als `limit`.
 */
export function anfangsAbstand(eingabe: string, name: string, limit: number): number {
  const zeile = Array.from({ length: name.length + 1 }, (_, j) => j > limit ? limit + 1 : j);
  // Ein Vergleich lohnt nur, solange der Name nicht viel kürzer als die Eingabe ist.
  if (name.length + limit < eingabe.length) return limit + 1;

  for (let i = 1; i <= eingabe.length; i++) {
    let vorherige = zeile[0]!;
    zeile[0] = i;
    let kleinste = i;
    for (let j = 1; j <= name.length; j++) {
      const diagonal = vorherige;
      vorherige = zeile[j]!;
      zeile[j] = Math.min(
        zeile[j]! + 1, // Zeichen im Namen fehlt in der Eingabe
        zeile[j - 1]! + 1, // Zeichen in der Eingabe fehlt im Namen
        diagonal + (eingabe[i - 1] === name[j - 1] ? 0 : 1),
      );
      kleinste = Math.min(kleinste, zeile[j]!);
    }
    if (kleinste > limit) return limit + 1;
  }

  // Der Rest des Namens hinter dem Treffer kostet nichts.
  return Math.min(...zeile.slice(0, name.length + 1));
}

/**
 * Fallback, wenn die normale Suche nichts findet: Namen, die sich nur durch
 * wenige Tippfehler von der Eingabe unterscheiden - ähnlichste zuerst.
 */
export function searchAehnliche<T>(
  query: string,
  items: T[],
  nameOf: (item: T) => string,
  maxTreffer = 8,
): T[] {
  const q = normalizeUnscharf(query);
  const limit = erlaubteFehler(q.length);
  if (limit === 0) return [];

  const treffer: { item: T; abstand: number; laenge: number }[] = [];
  for (const item of items) {
    const name = normalizeUnscharf(nameOf(item));
    const abstand = anfangsAbstand(q, name, limit);
    if (abstand <= limit) treffer.push({ item, abstand, laenge: name.length });
  }

  treffer.sort((a, b) => a.abstand - b.abstand || a.laenge - b.laenge);
  return treffer.slice(0, maxTreffer).map((t) => t.item);
}

export function searchAehnlicheStrassen(query: string, strassen: Strasse[]): Strasse[] {
  return searchAehnliche(query, strassen, (s) => s.n);
}

export function searchAehnlicheGemeinden(
  query: string,
  gemeinden: GemeindeEintrag[],
): GemeindeEintrag[] {
  return searchAehnliche(query, gemeinden, (g) => g.name);
}
