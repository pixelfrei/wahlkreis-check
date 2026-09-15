import { describe, expect, it } from "vitest";
import { parseRohtext } from "./parse.js";

describe("parseRohtext", () => {
  it("parst eine normale Bereichszeile", () => {
    const text = "fortlaufend\t00008 Achatiusweg 004 - 215 Südost\t026";
    expect(parseRohtext(text)).toEqual([
      { strasse: "Achatiusweg", von: 4, bis: 26, par: "b", stimmbezirk: 215 },
    ]);
  });

  it("liest gerade/ungerade als konkrete Parität", () => {
    const text = "gerade\t00040 Admiral-Spee-Straße 008 - 073 Mitte\t028";
    expect(parseRohtext(text)).toEqual([
      { strasse: "Admiral-Spee-Straße", von: 8, bis: 28, par: "g", stimmbezirk: 73 },
    ]);
  });

  it("parst eine einzelne Hausnummer ohne Bereich", () => {
    const text = "00107 Albert-Schweitzer-Campus 001 304 West";
    expect(parseRohtext(text)).toEqual([
      { strasse: "Albert-Schweitzer-Campus", von: 1, bis: 1, par: "b", stimmbezirk: 304 },
    ]);
  });

  it("verwirft Zeilen ohne echte Hausnummer", () => {
    const text = "00005 Aakamp Keine echte Hausnummer vorhanden";
    expect(parseRohtext(text)).toEqual([]);
  });

  it("fügt einen über mehrere Zeilen umgebrochenen Straßennamen wieder zusammen", () => {
    const text = [
      "fortlaufend\t00628 An der Hiltruper",
      "Baumschule",
      "003 - 254 Hiltrup\t037",
    ].join("\n");
    expect(parseRohtext(text)).toEqual([
      { strasse: "An der Hiltruper Baumschule", von: 3, bis: 37, par: "b", stimmbezirk: 254 },
    ]);
  });

  it("fügt einen mit Bindestrich umgebrochenen Straßennamen ohne zusätzliches Leerzeichen zusammen", () => {
    const text = [
      "fortlaufend\t01327 Christoph-Bernhard-",
      "Graben",
      "001 - 281 West\t185",
    ].join("\n");
    expect(parseRohtext(text)).toEqual([
      { strasse: "Christoph-Bernhard-Graben", von: 1, bis: 185, par: "b", stimmbezirk: 281 },
    ]);
  });

  it("überspringt Kopf-, Fuß- und Seitenmarker-Zeilen", () => {
    const text = [
      "Stadt Münster, Stadtplanungsamt",
      "Straßenverzeichnis mit Stimmbezirk und Bezirksvertretung",
      "Stand: 19.05.2025",
      "-- 1 of 94 --",
      "Seite 1 von 94",
      "A",
      "fortlaufend\t00008 Achatiusweg 004 - 215 Südost\t026",
    ].join("\n");
    expect(parseRohtext(text)).toEqual([
      { strasse: "Achatiusweg", von: 4, bis: 26, par: "b", stimmbezirk: 215 },
    ]);
  });
});
