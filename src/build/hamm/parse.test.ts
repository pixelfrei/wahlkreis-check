import { describe, expect, it } from "vitest";
import { hammZeileZuRohZeilen, parseZeile, rekonstruiereFelder } from "./parse.js";

describe("rekonstruiereFelder", () => {
  it("lässt vollständige 7-Felder-Zeilen unverändert", () => {
    const fields = ["1 ", "Alsenstraße ", "1 ", "13 ", "2 ", "12 ", "Mitte"];
    expect(rekonstruiereFelder(fields)).toBe(fields);
  });

  it("trennt Straßenname und erste Hausnummer (Johann-Sebastian-Bach-Straße)", () => {
    const fields = ["2", "Johann-Sebastian-Bach-Straße 23", "23", "18", "20", "Mitte"];
    expect(rekonstruiereFelder(fields)).toEqual([
      "2",
      "Johann-Sebastian-Bach-Straße",
      "23",
      "23",
      "18",
      "20",
      "Mitte",
    ]);
  });

  it("trennt Buchstabenzusatz und nächste Zahl (Alter Uentroper Weg)", () => {
    const fields = ["9", "Alter Uentroper Weg", "205", "263 a 174", "272", "Uentrop"];
    expect(rekonstruiereFelder(fields)).toEqual([
      "9",
      "Alter Uentroper Weg",
      "205",
      "263 a",
      "174",
      "272",
      "Uentrop",
    ]);
  });

  it("trennt Buchstabenzusatz und nächste Zahl, wenn die gerade Spalte betroffen ist (Ostenallee)", () => {
    const fields = ["8", "Ostenallee", "81", "137", "76 b 144", "Uentrop"];
    expect(rekonstruiereFelder(fields)).toEqual([
      "8",
      "Ostenallee",
      "81",
      "137",
      "76 b",
      "144",
      "Uentrop",
    ]);
  });

  it("wirft bei nicht auflösbaren 6-Felder-Zeilen", () => {
    expect(() => rekonstruiereFelder(["1", "X", "1", "2", "3", "Mitte"])).toThrow();
  });
});

describe("parseZeile", () => {
  it("baut eine normale Zeile mit beiden Paritäten", () => {
    expect(parseZeile(["1", "Alsenstraße", "1", "13", "2", "12", "Mitte"])).toEqual({
      strasse: "Alsenstraße",
      stadtbezirk: "Mitte",
      ungeradeVon: "1",
      ungeradeBis: "13",
      geradeVon: "2",
      geradeBis: "12",
    });
  });

  it("erkennt bei einer Einzelspalte die gerade Parität an den Zahlen (Radbodstraße)", () => {
    expect(parseZeile(["1", "Radbodstraße", "4", "12", "Mitte"])).toEqual({
      strasse: "Radbodstraße",
      stadtbezirk: "Mitte",
      ungeradeVon: null,
      ungeradeBis: null,
      geradeVon: "4",
      geradeBis: "12",
    });
  });

  it("erkennt bei einer Einzelspalte die ungerade Parität an den Zahlen (Augustastraße)", () => {
    expect(parseZeile(["1", "Augustastraße", "15", "45", "Mitte"])).toEqual({
      strasse: "Augustastraße",
      stadtbezirk: "Mitte",
      ungeradeVon: "15",
      ungeradeBis: "45",
      geradeVon: null,
      geradeBis: null,
    });
  });

  it("baut eine adresslose Zeile ohne Hausnummern", () => {
    expect(parseZeile(["18", "Johanna-Melzer-Straße", "Herringen"])).toEqual({
      strasse: "Johanna-Melzer-Straße",
      stadtbezirk: "Herringen",
      ungeradeVon: null,
      ungeradeBis: null,
      geradeVon: null,
      geradeBis: null,
    });
  });

  it("wirft bei widersprüchlicher Parität innerhalb einer Einzelspalte", () => {
    expect(() => parseZeile(["1", "X", "1", "12", "Mitte"])).toThrow();
  });
});

describe("hammZeileZuRohZeilen", () => {
  it("baut beide Bereiche mit Herringen -> Wahlkreis 117", () => {
    expect(
      hammZeileZuRohZeilen({
        strasse: "Albert-Funk-Straße",
        stadtbezirk: "Herringen",
        ungeradeVon: "87",
        ungeradeBis: "117",
        geradeVon: "116",
        geradeBis: "168",
      }),
    ).toEqual([
      { von: 87, bis: 117, par: "u", wk: "117" },
      { von: 116, bis: 168, par: "g", wk: "117" },
    ]);
  });

  it("ordnet übrige Stadtbezirke Wahlkreis 118 zu", () => {
    expect(
      hammZeileZuRohZeilen({
        strasse: "Alsenstraße",
        stadtbezirk: "Mitte",
        ungeradeVon: "1",
        ungeradeBis: "13",
        geradeVon: "2",
        geradeBis: "12",
      }),
    ).toEqual([
      { von: 1, bis: 13, par: "u", wk: "118" },
      { von: 2, bis: 12, par: "g", wk: "118" },
    ]);
  });

  it("verschiebt die untere Grenze bei Buchstabenzusatz um eins", () => {
    expect(
      hammZeileZuRohZeilen({
        strasse: "Große Werlstraße",
        stadtbezirk: "Pelkum",
        ungeradeVon: "53 a",
        ungeradeBis: "129",
        geradeVon: "56",
        geradeBis: "136",
      }),
    ).toEqual([
      { von: 54, bis: 129, par: "u", wk: "118", buchstaben: [{ nummer: 53, zusatz: "a", ab: true }] },
      { von: 56, bis: 136, par: "g", wk: "118" },
    ]);
  });

  it("baut einen wk-Eintrag ohne Bereich, wenn keine Hausnummern vorhanden sind", () => {
    expect(
      hammZeileZuRohZeilen({
        strasse: "Johanna-Melzer-Straße",
        stadtbezirk: "Herringen",
        ungeradeVon: null,
        ungeradeBis: null,
        geradeVon: null,
        geradeBis: null,
      }),
    ).toEqual([{ von: null, bis: null, par: null, wk: "117" }]);
  });
});
