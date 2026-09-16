import { describe, expect, it } from "vitest";
import type { GemeindeEintrag, Strasse } from "../shared/types.js";
import {
  anfangsAbstand,
  normalize,
  normalizeSuche,
  searchAehnlicheGemeinden,
  searchAehnlicheStrassen,
  searchGemeinden,
  searchStrassen,
} from "./search.js";

describe("normalize", () => {
  it("behandelt kreuzstr, Kreuzstraße und kreuzstrasse gleich", () => {
    expect(normalize("kreuzstr")).toBe(normalize("Kreuzstraße"));
    expect(normalize("kreuzstr")).toBe(normalize("kreuzstrasse"));
    expect(normalize("kreuzstr")).toBe(normalize("Kreuzstr."));
  });

  it("löst Umlaute und ß auf und entfernt Bindestriche/Leerzeichen", () => {
    expect(normalize("Freie-Vogel-Straße")).toBe(normalize("freie vogel str"));
    expect(normalize("Bönninghauser Straße")).toBe("boenninghauserstr");
  });
});

describe("normalizeSuche", () => {
  it("behandelt Str., Straße und Strasse gleich - auch mitten im Namen", () => {
    expect(normalizeSuche("Bickestraße I.")).toBe(normalizeSuche("bickestr I"));
    expect(normalizeSuche("Erzstr. Kleingarten")).toBe(normalizeSuche("Erzstraße Kleingarten"));
    expect(normalizeSuche("Rüttenscheider Str.")).toBe(normalizeSuche("rüttenscheider straße"));
  });

  it("ignoriert Punkte und Leerzeichen", () => {
    expect(normalizeSuche("Dr.-Bernhard-Klein-Straße")).toBe(normalizeSuche("Dr Bernhard Klein Str"));
  });

  it("behandelt Sankt wie St.", () => {
    expect(normalizeSuche("St.-Vither-Strasse")).toBe(normalizeSuche("Sankt-Vither-Straße"));
    expect(normalizeSuche("Sankt Augustin")).toBe(normalizeSuche("St. Augustin"));
  });

  it("lässt die Adressen der Städte unverändert (normalize)", () => {
    expect(normalize("Sankt Augustin")).toBe("sanktaugustin");
  });
});

const STRASSEN: Strasse[] = [
  { n: "KREUZSTRAßE", wk: "111" },
  { n: "ARDEYSTRAßE", b: [] },
  { n: "AM KREUZ", wk: "112" },
];

describe("searchStrassen", () => {
  it("findet Präfix- vor Teiltreffern", () => {
    const result = searchStrassen("kreuz", STRASSEN);
    expect(result.map((s) => s.n)).toEqual(["KREUZSTRAßE", "AM KREUZ"]);
  });

  it("liefert leeres Ergebnis für leere Eingabe", () => {
    expect(searchStrassen("", STRASSEN)).toEqual([]);
  });

  it("findet kreuzstr auf KREUZSTRAßE", () => {
    const result = searchStrassen("kreuzstr", STRASSEN);
    expect(result.map((s) => s.n)).toEqual(["KREUZSTRAßE"]);
  });
});

const GEMEINDEN: GemeindeEintrag[] = [
  { name: "Dortmund", typ: "geteilt", verfuegbar: true, datei: "dortmund.json" },
  { name: "Dorsten", typ: "einfach", wk: "64" },
];

describe("searchGemeinden", () => {
  it("findet Gemeinden nach demselben Präfix-Prinzip", () => {
    const result = searchGemeinden("dor", GEMEINDEN);
    expect(result.map((g) => g.name)).toEqual(["Dortmund", "Dorsten"]);
  });
});

describe("searchAehnliche", () => {
  const strassen: Strasse[] = [
    { n: "ARDEYSTRAßE", wk: "111" },
    { n: "RÜTTENSCHEIDER STR.", wk: "112" },
    { n: "SCHILFWEG", wk: "113" },
    { n: "AM KREUZ", wk: "114" },
  ];

  it("findet Namen trotz Tippfehler, auch im Wortteil Straße", () => {
    expect(searchAehnlicheStrassen("ardeystrase", strassen).map((s) => s.n)).toEqual(["ARDEYSTRAßE"]);
    expect(searchAehnlicheStrassen("Schilfwek", strassen).map((s) => s.n)).toEqual(["SCHILFWEG"]);
    expect(searchAehnlicheStrassen("ruetenscheider", strassen).map((s) => s.n)).toEqual([
      "RÜTTENSCHEIDER STR.",
    ]);
  });

  it("ignoriert überstehende Zeichen am Ende des Straßennamens", () => {
    // Eingabe deckt nur den Anfang ab - der Rest des Namens kostet nichts
    expect(searchAehnlicheStrassen("Rütenscheider", strassen).map((s) => s.n)).toEqual([
      "RÜTTENSCHEIDER STR.",
    ]);
  });

  it("bleibt bei kurzen Eingaben streng und schlägt nichts vor", () => {
    expect(searchAehnlicheStrassen("kre", strassen)).toEqual([]);
  });

  it("schlägt nichts vor, was zu weit entfernt ist", () => {
    expect(searchAehnlicheStrassen("bahnhofsallee", strassen)).toEqual([]);
  });

  it("sortiert den ähnlichsten Namen nach vorne", () => {
    const treffer = searchAehnlicheStrassen("ardeystrasse", [
      { n: "ERDESTRAßE", wk: "1" },
      { n: "ARDEYSTRAßE", wk: "2" },
    ]);
    expect(treffer[0]!.n).toBe("ARDEYSTRAßE");
  });

  it("gilt genauso für Städte", () => {
    expect(searchAehnlicheGemeinden("Gelsenkichen", [
      { name: "Gelsenkirchen", typ: "einfach", wk: "74" },
      { name: "Dortmund", typ: "einfach", wk: "111" },
    ]).map((g) => g.name)).toEqual(["Gelsenkirchen"]);
  });
});

describe("anfangsAbstand", () => {
  it("zählt fehlende, zusätzliche und vertauschte Zeichen", () => {
    expect(anfangsAbstand("abc", "abc", 2)).toBe(0);
    expect(anfangsAbstand("abc", "abcdef", 2)).toBe(0); // Rest des Namens kostet nichts
    expect(anfangsAbstand("abx", "abc", 2)).toBe(1);
    expect(anfangsAbstand("ac", "abc", 2)).toBe(1);
    expect(anfangsAbstand("abbc", "abc", 2)).toBe(1);
  });

  it("bricht über dem Limit ab", () => {
    expect(anfangsAbstand("xyz", "abc", 1)).toBeGreaterThan(1);
  });
});
