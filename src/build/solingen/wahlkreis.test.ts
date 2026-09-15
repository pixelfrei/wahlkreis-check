import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer (Solingen)", () => {
  it("ordnet Gräfrath (KWB 51-53) komplett WK34 zu", () => {
    expect(wahlkreisFuer(511)).toBe("34");
    expect(wahlkreisFuer(533)).toBe("34");
  });

  it("ordnet Mitte-KWB 15/16 WK34 zu", () => {
    expect(wahlkreisFuer(151)).toBe("34");
    expect(wahlkreisFuer(163)).toBe("34");
  });

  it("ordnet Stimmbezirk 123 (aus KWB12) WK34 zu, den Rest von KWB12 aber WK35", () => {
    expect(wahlkreisFuer(123)).toBe("34");
    expect(wahlkreisFuer(121)).toBe("35");
    expect(wahlkreisFuer(122)).toBe("35");
  });

  it("ordnet die übrigen Mitte-Kommunalwahlbezirke WK35 zu", () => {
    expect(wahlkreisFuer(111)).toBe("35");
    expect(wahlkreisFuer(141)).toBe("35");
  });

  it("ordnet Ohligs/Aufderhöhe/Merscheid, Burg/Höhscheid und Wald komplett WK35 zu", () => {
    expect(wahlkreisFuer(211)).toBe("35");
    expect(wahlkreisFuer(273)).toBe("35");
    expect(wahlkreisFuer(411)).toBe("35");
    expect(wahlkreisFuer(463)).toBe("35");
    expect(wahlkreisFuer(311)).toBe("35");
    expect(wahlkreisFuer(343)).toBe("35");
  });

  it("wirft bei unbekanntem Kommunalwahlbezirk", () => {
    expect(() => wahlkreisFuer(611)).toThrow();
  });
});
