import { describe, expect, it } from "vitest";
import { entmangleBereich, entmangleDatumsSegment, repariereDoppelteKodierung } from "./parse.js";

describe("repariereDoppelteKodierung", () => {
  it("macht doppelt kodierte Umlaute und ß wieder lesbar", () => {
    expect(repariereDoppelteKodierung("RÃ¼ttenscheider Str.")).toBe("Rüttenscheider Str.");
    expect(repariereDoppelteKodierung("Ã„btissinsteig")).toBe("Äbtissinsteig");
    expect(repariereDoppelteKodierung("GroÃŸe Str.")).toBe("Große Str.");
  });

  it("lässt korrekt kodierten Text unverändert", () => {
    expect(repariereDoppelteKodierung("Rüttenscheider Str.")).toBe("Rüttenscheider Str.");
    expect(repariereDoppelteKodierung("Aachener Str.")).toBe("Aachener Str.");
  });
});

describe("entmangleDatumsSegment", () => {
  it("löst das Monat-zuerst-Muster auf (Excel-Datumsformatierung)", () => {
    expect(entmangleDatumsSegment("Jan 24")).toBe("1-24");
    expect(entmangleDatumsSegment("Jul 37")).toBe("7-37");
    expect(entmangleDatumsSegment("Mai 47")).toBe("5-47");
  });

  it("löst das Tag-zuerst-Muster auf", () => {
    expect(entmangleDatumsSegment("01. Okt")).toBe("1-10");
    expect(entmangleDatumsSegment("02. Apr")).toBe("2-4");
    expect(entmangleDatumsSegment("08. Dez")).toBe("8-12");
  });

  it("lässt unbetroffene Segmente unverändert", () => {
    expect(entmangleDatumsSegment("7-33 ung.")).toBe("7-33 ung.");
    expect(entmangleDatumsSegment("1A-35")).toBe("1A-35");
  });
});

describe("entmangleBereich", () => {
  it("entmangelt jedes kommagetrennte Segment einzeln", () => {
    expect(entmangleBereich("1A-23,36-58 ger.,83-107")).toBe("1A-23,36-58 ger.,83-107");
    expect(entmangleBereich("Jan 24")).toBe("1-24");
  });

  it("lässt eine leere Zelle unverändert", () => {
    expect(entmangleBereich("")).toBe("");
  });
});
