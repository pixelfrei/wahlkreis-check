import { describe, expect, it } from "vitest";
import { wahlkreisFuerWahlbezirk } from "./wahlkreis.js";

describe("wahlkreisFuerWahlbezirk (Hilden)", () => {
  it("ordnet 3010-3050 und 3070-3100 Wahlkreis 37 zu", () => {
    expect(wahlkreisFuerWahlbezirk(3010)).toBe("37");
    expect(wahlkreisFuerWahlbezirk(3050)).toBe("37");
    expect(wahlkreisFuerWahlbezirk(3070)).toBe("37");
    expect(wahlkreisFuerWahlbezirk(3100)).toBe("37");
  });

  it("ordnet 3060 Wahlkreis 38 zu, obwohl es im 3010-3100-Bereich liegt", () => {
    expect(wahlkreisFuerWahlbezirk(3060)).toBe("38");
  });

  it("ordnet 3110-3200 Wahlkreis 38 zu", () => {
    expect(wahlkreisFuerWahlbezirk(3110)).toBe("38");
    expect(wahlkreisFuerWahlbezirk(3200)).toBe("38");
  });

  it("wirft bei unbekanntem Wahlbezirk", () => {
    expect(() => wahlkreisFuerWahlbezirk(3300)).toThrow();
    expect(() => wahlkreisFuerWahlbezirk(3005)).toThrow();
  });
});
