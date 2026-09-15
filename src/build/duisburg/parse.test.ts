import { describe, expect, it } from "vitest";
import { benenneMehrdeutigeNamen, komprimiereZuBereichen } from "./parse.js";

describe("komprimiereZuBereichen", () => {
  it("fasst zusammenhängende Nummern gleicher Parität und Wahlkreis zusammen", () => {
    const result = komprimiereZuBereichen([
      { hausnummer: 2, wk: "61" },
      { hausnummer: 4, wk: "61" },
      { hausnummer: 6, wk: "61" },
      { hausnummer: 1, wk: "61" },
      { hausnummer: 3, wk: "61" },
    ]);
    expect(result).toEqual([
      { von: 1, bis: 3, par: "u", wk: "61" },
      { von: 2, bis: 6, par: "g", wk: "61" },
    ]);
  });

  it("trennt den Bereich, sobald sich der Wahlkreis ändert", () => {
    const result = komprimiereZuBereichen([
      { hausnummer: 2, wk: "61" },
      { hausnummer: 4, wk: "61" },
      { hausnummer: 6, wk: "62" },
      { hausnummer: 8, wk: "62" },
    ]);
    expect(result).toEqual([
      { von: 2, bis: 4, par: "g", wk: "61" },
      { von: 6, bis: 8, par: "g", wk: "62" },
    ]);
  });

  it("trennt den Bereich bei einer Lücke, auch wenn der Wahlkreis gleich bleibt", () => {
    const result = komprimiereZuBereichen([
      { hausnummer: 2, wk: "61" },
      { hausnummer: 4, wk: "61" },
      { hausnummer: 10, wk: "61" },
    ]);
    expect(result).toEqual([
      { von: 2, bis: 4, par: "g", wk: "61" },
      { von: 10, bis: 10, par: "g", wk: "61" },
    ]);
  });

  it("ignoriert doppelte Zusatz-Zeilen an derselben Basisnummer", () => {
    const result = komprimiereZuBereichen([
      { hausnummer: 86, wk: "63" },
      { hausnummer: 86, wk: "63" },
      { hausnummer: 86, wk: "63" },
    ]);
    expect(result).toEqual([{ von: 86, bis: 86, par: "g", wk: "63" }]);
  });
});

describe("benenneMehrdeutigeNamen", () => {
  it("fasst gleichnamige Straßen mit demselben Wahlkreis zusammen", () => {
    const result = benenneMehrdeutigeNamen([
      { strschl: "7003", name: "Ackerstr.", stadtbezirk: "Rheinhausen", ergebnis: { n: "x", wk: "62" } },
      { strschl: "6003", name: "Ackerstr.", stadtbezirk: "Rheinhausen", ergebnis: { n: "x", wk: "62" } },
    ]);
    expect(result).toEqual([{ n: "Ackerstr.", wk: "62" }]);
  });

  it("benennt nach Stadtbezirk um, wenn sich gleichnamige Straßen widersprechen", () => {
    const result = benenneMehrdeutigeNamen([
      { strschl: "1005", name: "Ackerstr.", stadtbezirk: "Süd", ergebnis: { n: "x", wk: "61" } },
      { strschl: "9001", name: "Ackerstr.", stadtbezirk: "Homberg/Ruhrort/Baerl", ergebnis: { n: "x", wk: "62" } },
      { strschl: "7003", name: "Ackerstr.", stadtbezirk: "Rheinhausen", ergebnis: { n: "x", wk: "62" } },
      { strschl: "6003", name: "Ackerstr.", stadtbezirk: "Rheinhausen", ergebnis: { n: "x", wk: "62" } },
    ]);
    expect(result).toEqual(
      expect.arrayContaining([
        { n: "Ackerstr. (Süd)", wk: "61" },
        { n: "Ackerstr. (Homberg/Ruhrort/Baerl)", wk: "62" },
        { n: "Ackerstr. (Rheinhausen)", wk: "62" },
      ]),
    );
    expect(result).toHaveLength(3);
  });

  it("lässt eindeutige Namen unverändert", () => {
    const result = benenneMehrdeutigeNamen([
      { strschl: "1", name: "Einzelweg", stadtbezirk: "Mitte", ergebnis: { n: "x", wk: "61" } },
    ]);
    expect(result).toEqual([{ n: "Einzelweg", wk: "61" }]);
  });
});
