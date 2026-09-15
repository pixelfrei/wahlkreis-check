import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer", () => {
  it("ordnet Kommunalwahlbezirke aus der WK83-Liste zu", () => {
    expect(wahlkreisFuer(31)).toBe("83"); // Kommunalwahlbezirk 3 Kreuz
    expect(wahlkreisFuer(311)).toBe("83"); // Kommunalwahlbezirk 31 Gievenbeck-Süd
    expect(wahlkreisFuer(321)).toBe("83"); // Kommunalwahlbezirk 32 Gievenbeck-Nord
  });

  it("ordnet Kommunalwahlbezirke aus der WK84-Liste zu", () => {
    expect(wahlkreisFuer(73)).toBe("84"); // Kommunalwahlbezirk 7 Mauritz-Mitte
    expect(wahlkreisFuer(215)).toBe("84"); // Kommunalwahlbezirk 21 Wolbeck
  });

  it("ordnet Kommunalwahlbezirke aus der WK85-Liste zu", () => {
    expect(wahlkreisFuer(15)).toBe("85"); // Kommunalwahlbezirk 1 Altstadt
    expect(wahlkreisFuer(25)).toBe("85"); // Kommunalwahlbezirk 2 Schloss
  });

  it("wirft bei einem unbekannten Kommunalwahlbezirk", () => {
    expect(() => wahlkreisFuer(990)).toThrow();
  });
});
