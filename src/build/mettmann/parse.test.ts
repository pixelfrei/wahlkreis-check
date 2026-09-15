import { describe, expect, it } from "vitest";
import { parseHausnummernBereich } from "./parse.js";

describe("parseHausnummernBereich", () => {
  it("baut einen wk-Eintrag ohne Bereich für 'alle'", () => {
    expect(parseHausnummernBereich("alle", "38")).toEqual({
      von: null,
      bis: null,
      par: null,
      wk: "38",
    });
  });

  it("liest gerade/ungerade als konkrete Parität", () => {
    expect(parseHausnummernBereich("10 - 30 gerade", "38")).toEqual({
      von: 10,
      bis: 30,
      par: "g",
      wk: "38",
    });
    expect(parseHausnummernBereich("1 - 35 ungerade", "40")).toEqual({
      von: 1,
      bis: 35,
      par: "u",
      wk: "40",
    });
  });

  it("deckt einen Bereich ohne Paritäts-Hinweis als beide Paritäten ab", () => {
    expect(parseHausnummernBereich("1 - 30", "38")).toEqual({
      von: 1,
      bis: 30,
      par: "b",
      wk: "38",
    });
  });

  it("behandelt eine einzelne Hausnummer als Punkt, auch mit Buchstabenzusatz", () => {
    expect(parseHausnummernBereich("2 A", "38")).toEqual({
      von: 2,
      bis: 2,
      par: "b",
      wk: "38",
      buchstaben: [{ nummer: 2, zusatz: "a" }],
    });
  });

  it("verschiebt die untere Grenze bei Buchstabenzusatz um eins", () => {
    expect(parseHausnummernBereich("1 A - 3 A ungerade", "38")).toEqual({
      von: 2,
      bis: 3,
      par: "u",
      wk: "38",
      buchstaben: [
        { nummer: 1, zusatz: "a" },
        { nummer: 3, zusatz: "a" },
      ],
    });
  });

  it("verschiebt auch bei einem Zusatz an der unteren Grenze eines längeren Bereichs", () => {
    expect(parseHausnummernBereich("42 A - 88 gerade", "40")).toEqual({
      von: 43,
      bis: 88,
      par: "g",
      wk: "40",
      buchstaben: [{ nummer: 42, zusatz: "a" }],
    });
  });
});
