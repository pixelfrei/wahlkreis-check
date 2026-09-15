import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer (Hagen)", () => {
  it("ordnet Wahlbezirk 01-08 WK103 zu", () => {
    expect(wahlkreisFuer(1011)).toBe("103");
    expect(wahlkreisFuer(1085)).toBe("103");
  });

  it("ordnet Wahlbezirk 09/10 (Wehringhausen) WK104 zu", () => {
    expect(wahlkreisFuer(1091)).toBe("104");
    expect(wahlkreisFuer(1106)).toBe("104");
  });

  it("ordnet Wahlbezirk 11-20 WK103 zu, auch über Stadtbezirk-Grenzen hinweg", () => {
    expect(wahlkreisFuer(2111)).toBe("103");
    expect(wahlkreisFuer(3194)).toBe("103");
    // Wahlbezirk 20 "Eilpe-Zentrum/Oberhagen" reicht über Stadtbezirk 1
    // (1201/1202) UND Stadtbezirk 4 (4203-4205) - beide müssen WK103 sein.
    expect(wahlkreisFuer(1201)).toBe("103");
    expect(wahlkreisFuer(4203)).toBe("103");
  });

  it("ordnet Wahlbezirk 21-26 WK104 zu", () => {
    expect(wahlkreisFuer(4211)).toBe("104");
    expect(wahlkreisFuer(5266)).toBe("104");
  });

  it("wirft bei unbekanntem Wahlbezirk", () => {
    expect(() => wahlkreisFuer(6001)).toThrow();
  });
});
