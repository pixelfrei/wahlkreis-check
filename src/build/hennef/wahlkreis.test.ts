import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer (Hennef)", () => {
  it("ordnet die WK26-Stimmbezirke Rhein-Sieg-Kreis II zu", () => {
    expect(wahlkreisFuer(112)).toBe("26");
    expect(wahlkreisFuer(131)).toBe("26");
    expect(wahlkreisFuer(132)).toBe("26");
    expect(wahlkreisFuer(170)).toBe("26");
  });

  it("ordnet den Rest Rhein-Sieg-Kreis I zu, inklusive des korrigierten Stimmbezirks 200", () => {
    expect(wahlkreisFuer(11)).toBe("25");
    expect(wahlkreisFuer(200)).toBe("25");
    expect(wahlkreisFuer(192)).toBe("25");
  });

  it("wirft beim Anlage-Stimmbezirk 202, der bei Hennef nicht existiert", () => {
    expect(() => wahlkreisFuer(202)).toThrow();
  });

  it("wirft bei sonst unbekanntem Stimmbezirk", () => {
    expect(() => wahlkreisFuer(999)).toThrow();
  });
});
