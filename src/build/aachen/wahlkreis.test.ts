import { describe, expect, it } from "vitest";
import { stadtteilAusStimmbezirk, wahlkreisFuerStadtteil } from "./wahlkreis.js";

describe("stadtteilAusStimmbezirk", () => {
  it("liest die Stadtteil-Nummer aus den ersten zwei Ziffern", () => {
    expect(stadtteilAusStimmbezirk("1604")).toBe(16);
    expect(stadtteilAusStimmbezirk("4605")).toBe(46);
    expect(stadtteilAusStimmbezirk("1002")).toBe(10);
  });
});

describe("wahlkreisFuerStadtteil", () => {
  it("ordnet Mitte-Stadtteile aus der WK1-Liste korrekt zu", () => {
    expect(wahlkreisFuerStadtteil(10)).toBe("1");
    expect(wahlkreisFuerStadtteil(34)).toBe("1"); // Rothe Erde
    expect(wahlkreisFuerStadtteil(48)).toBe("1");
  });

  it("ordnet Mitte-Stadtteile aus der WK2-Liste korrekt zu", () => {
    expect(wahlkreisFuerStadtteil(33)).toBe("2"); // Panneschopp
    expect(wahlkreisFuerStadtteil(46)).toBe("2");
  });

  it("ordnet die kompletten Stadtbezirke Laurensberg/Richterich/Haaren WK1 zu", () => {
    expect(wahlkreisFuerStadtteil(53)).toBe("1"); // Haaren
    expect(wahlkreisFuerStadtteil(64)).toBe("1"); // Vaalserquartier (Laurensberg)
    expect(wahlkreisFuerStadtteil(65)).toBe("1"); // Laurensberg
    expect(wahlkreisFuerStadtteil(66)).toBe("1"); // Richterich
  });

  it("ordnet die kompletten Stadtbezirke Kornelimünster/Walheim/Brand/Eilendorf WK2 zu", () => {
    expect(wahlkreisFuerStadtteil(51)).toBe("2"); // Brand
    expect(wahlkreisFuerStadtteil(52)).toBe("2"); // Eilendorf
    expect(wahlkreisFuerStadtteil(61)).toBe("2"); // Kornelimünster
    expect(wahlkreisFuerStadtteil(62)).toBe("2"); // Oberforstbach
    expect(wahlkreisFuerStadtteil(63)).toBe("2"); // Walheim
  });

  it("wirft bei unbekanntem Stadtteil", () => {
    expect(() => wahlkreisFuerStadtteil(99)).toThrow();
    expect(() => wahlkreisFuerStadtteil(11)).toThrow(); // in Aachen nicht vergeben
  });
});
