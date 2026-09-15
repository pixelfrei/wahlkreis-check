import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer (Bochum)", () => {
  it("ordnet WK107-Kommunalwahlbezirke korrekt zu", () => {
    expect(wahlkreisFuer(10)).toBe("107");
    expect(wahlkreisFuer(11)).toBe("107");
    expect(wahlkreisFuer(17)).toBe("107");
    expect(wahlkreisFuer(31)).toBe("107");
    expect(wahlkreisFuer(45)).toBe("107");
  });

  it("ordnet WK108-Kommunalwahlbezirke korrekt zu", () => {
    expect(wahlkreisFuer(13)).toBe("108");
    expect(wahlkreisFuer(51)).toBe("108");
    expect(wahlkreisFuer(65)).toBe("108");
  });

  it("ordnet WK109-Kommunalwahlbezirke korrekt zu", () => {
    expect(wahlkreisFuer(12)).toBe("109");
    expect(wahlkreisFuer(14)).toBe("109");
    expect(wahlkreisFuer(18)).toBe("109");
    expect(wahlkreisFuer(27)).toBe("109");
  });

  it("wirft bei unbekanntem Kommunalwahlbezirk", () => {
    expect(() => wahlkreisFuer(99)).toThrow();
    expect(() => wahlkreisFuer(19)).toThrow();
  });
});
