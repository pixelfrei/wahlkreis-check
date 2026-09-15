import { describe, expect, it } from "vitest";
import { duesseldorfZeileZuRohZeilen } from "./parse.js";

describe("duesseldorfZeileZuRohZeilen", () => {
  it("baut beide Bereiche aus getrennten Von/Bis/Zusatz-Spalten", () => {
    const result = duesseldorfZeileZuRohZeilen({
      strasse: "Abteihofstraße",
      stadtbezirk: "03",
      stadtteilname: "Volmerswerth",
      ungeradeVon: "1",
      ungeradeVonZus: "",
      ungeradeBis: "29",
      geradeVon: "4",
      geradeVonZus: "",
      geradeBis: "58",
    });
    expect(result).toEqual([
      { von: 1, bis: 29, par: "u", wk: "43" },
      { von: 4, bis: 58, par: "g", wk: "43" },
    ]);
  });

  it("verschiebt die untere Grenze bei Buchstabenzusatz um eins", () => {
    const result = duesseldorfZeileZuRohZeilen({
      strasse: "Am Bauenhaus",
      stadtbezirk: "06",
      stadtteilname: "Rath",
      ungeradeVon: "3",
      ungeradeVonZus: "A",
      ungeradeBis: "75",
      geradeVon: "30",
      geradeVonZus: "",
      geradeBis: "40",
    });
    expect(result).toEqual([
      { von: 4, bis: 75, par: "u", wk: "42", buchstaben: [{ nummer: 3, zusatz: "a", ab: true }] },
      { von: 30, bis: 40, par: "g", wk: "42" },
    ]);
  });

  it("baut einen wk-Eintrag ohne Bereich, wenn keine Hausnummern vorhanden sind", () => {
    const result = duesseldorfZeileZuRohZeilen({
      strasse: "Aachener Platz",
      stadtbezirk: "03",
      stadtteilname: "Bilk",
      ungeradeVon: null,
      ungeradeVonZus: "",
      ungeradeBis: null,
      geradeVon: null,
      geradeVonZus: "",
      geradeBis: null,
    });
    expect(result).toEqual([{ von: null, bis: null, par: null, wk: "43" }]);
  });
});
