import { describe, expect, it } from "vitest";
import { parseHausnummernBereich } from "./freitextBereich.js";

describe("parseHausnummernBereich", () => {
  it("baut einen wk-Eintrag ohne Bereich für eine leere Zelle (ganze Straße)", () => {
    expect(parseHausnummernBereich("", "64")).toEqual([
      { von: null, bis: null, par: null, wk: "64" },
    ]);
  });

  it("deckt einen unqualifizierten Bereich als beide Paritäten ab", () => {
    expect(parseHausnummernBereich("2-24", "64")).toEqual([{ von: 2, bis: 24, par: "b", wk: "64" }]);
  });

  it("liest ger./ung.-Qualifizierer als konkrete Parität", () => {
    expect(parseHausnummernBereich("14-60 ger.", "64")).toEqual([
      { von: 14, bis: 60, par: "g", wk: "64" },
    ]);
    expect(parseHausnummernBereich("33-69 ung.", "64")).toEqual([
      { von: 33, bis: 69, par: "u", wk: "64" },
    ]);
  });

  it("verarbeitet mehrere kommagetrennte Segmente in einer Zelle", () => {
    expect(parseHausnummernBereich("33-69 ung.,76-89,91-122", "64")).toEqual([
      { von: 33, bis: 69, par: "u", wk: "64" },
      { von: 76, bis: 89, par: "b", wk: "64" },
      { von: 91, bis: 122, par: "b", wk: "64" },
    ]);
  });

  it("behandelt eine einzelne Hausnummer als Punkt ohne Verschiebung, auch mit Buchstabenzusatz", () => {
    expect(parseHausnummernBereich("89A,89B", "64")).toEqual([
      { von: 89, bis: 89, par: "b", wk: "64", buchstaben: [{ nummer: 89, zusatz: "a" }] },
      { von: 89, bis: 89, par: "b", wk: "64", buchstaben: [{ nummer: 89, zusatz: "b" }] },
    ]);
    expect(parseHausnummernBereich("2A", "64")).toEqual([
      { von: 2, bis: 2, par: "b", wk: "64", buchstaben: [{ nummer: 2, zusatz: "a" }] },
    ]);
  });

  it("verschiebt die untere Grenze eines Bereichs bei Buchstabenzusatz um eins", () => {
    expect(parseHausnummernBereich("94A-123", "39")).toEqual([
      { von: 95, bis: 123, par: "b", wk: "39", buchstaben: [{ nummer: 94, zusatz: "a" }] },
    ]);
  });

  it("braucht keine Anpassung bei Buchstabenzusatz an der oberen Grenze", () => {
    expect(parseHausnummernBereich("1-54C", "64")).toEqual([
      { von: 1, bis: 54, par: "b", wk: "64", buchstaben: [{ nummer: 54, zusatz: "c" }] },
    ]);
  });
});
