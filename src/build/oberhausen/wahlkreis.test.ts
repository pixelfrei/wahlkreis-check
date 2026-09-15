import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer (Oberhausen)", () => {
  it("ordnet Alt-Oberhausen (KWB 01-12) WK56 zu", () => {
    expect(wahlkreisFuer(101)).toBe("56");
    expect(wahlkreisFuer(1201)).toBe("56");
  });

  it("ordnet Sterkrade (KWB 13-24) WK57 zu, auch Buschhausen (KWB13)", () => {
    expect(wahlkreisFuer(1301)).toBe("57");
    expect(wahlkreisFuer(2401)).toBe("57");
  });

  it("ordnet Osterfeld (KWB 25-29) WK56 zu, trotz numerischer Nähe zu Sterkrade", () => {
    expect(wahlkreisFuer(2501)).toBe("56");
    expect(wahlkreisFuer(2901)).toBe("56");
  });

  it("wirft bei unbekanntem Kommunalwahlbezirk", () => {
    expect(() => wahlkreisFuer(9001)).toThrow();
  });
});
