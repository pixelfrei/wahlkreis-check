import { describe, expect, it } from "vitest";
import type { GemeindeEintrag, Strasse } from "../shared/types.js";
import { normalize, searchGemeinden, searchStrassen } from "./search.js";

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
