import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer", () => {
  it("ordnet Stadtbezirk 2 (Nord) und 3 (West) Wahlkreis 73 zu", () => {
    expect(wahlkreisFuer("2010")).toBe("73"); // Buer
    expect(wahlkreisFuer("3001")).toBe("73"); // Horst
  });

  it("ordnet Stadtbezirk 1, 4 und 5 Wahlkreis 74 zu", () => {
    expect(wahlkreisFuer("1103")).toBe("74"); // Schalke
    expect(wahlkreisFuer("4001")).toBe("74"); // Erle
    expect(wahlkreisFuer("5106")).toBe("74"); // Ückendorf
  });

  it("wirft bei einem unbekannten Stadtbezirk", () => {
    expect(() => wahlkreisFuer("9001")).toThrow();
  });
});
