import { describe, expect, it } from "vitest";
import { entferneUeberfluessigeAdresslose, istUnaufloesbarAdresslos } from "./gruppierung.js";

describe("entferneUeberfluessigeAdresslose", () => {
  it("verwirft adresslose Zeilen, wenn adressierte Zeilen existieren (Düsseldorf Am Dammsteg)", () => {
    // reales Beispiel: Wersten und Holthausen ohne Hausnummern, Eller mit Bereich
    const rows = [
      { von: null, bis: null, par: null, wk: "44" }, // Wersten
      { von: null, bis: null, par: null, wk: "44" }, // Holthausen
      { von: 9, bis: 77, par: "u" as const, wk: "42" }, // Eller
      { von: 24, bis: 98, par: "g" as const, wk: "42" },
    ];
    expect(entferneUeberfluessigeAdresslose(rows)).toEqual([
      { von: 9, bis: 77, par: "u", wk: "42" },
      { von: 24, bis: 98, par: "g", wk: "42" },
    ]);
  });

  it("behält die adresslose Zeile, wenn es die einzige ist", () => {
    const rows = [{ von: null, bis: null, par: null, wk: "41" }];
    expect(entferneUeberfluessigeAdresslose(rows)).toEqual(rows);
  });
});

describe("istUnaufloesbarAdresslos", () => {
  it("erkennt eine Brücke ohne Adressen über zwei Wahlkreise (Düsseldorf Oberkasseler Brücke)", () => {
    const rows = [
      { von: null, bis: null, par: null, wk: "41" },
      { von: null, bis: null, par: null, wk: "43" },
    ];
    expect(istUnaufloesbarAdresslos(rows)).toBe(true);
  });

  it("ist falsch, wenn adresslose Zeilen alle denselben Wahlkreis tragen", () => {
    const rows = [
      { von: null, bis: null, par: null, wk: "44" },
      { von: null, bis: null, par: null, wk: "44" },
    ];
    expect(istUnaufloesbarAdresslos(rows)).toBe(false);
  });

  it("ist falsch, sobald adressierte Zeilen vorhanden sind", () => {
    const rows = [
      { von: null, bis: null, par: null, wk: "44" },
      { von: null, bis: null, par: null, wk: "42" },
      { von: 1, bis: 9, par: "u" as const, wk: "42" },
    ];
    expect(istUnaufloesbarAdresslos(rows)).toBe(false);
  });
});
