import { describe, expect, it } from "vitest";
import { wahlkreisFuerStadtteil } from "./wahlkreis.js";

describe("wahlkreisFuerStadtteil (Marl)", () => {
  it("ordnet Polsum (50) Wahlkreis 71 zu", () => {
    expect(wahlkreisFuerStadtteil(50)).toBe("71");
  });

  it("ordnet die übrigen neun Stadtteile Wahlkreis 70 zu", () => {
    expect(wahlkreisFuerStadtteil(11)).toBe("70"); // Stadtkern
    expect(wahlkreisFuerStadtteil(12)).toBe("70"); // Alt-Marl
    expect(wahlkreisFuerStadtteil(13)).toBe("70"); // Brassert
    expect(wahlkreisFuerStadtteil(14)).toBe("70"); // Drewer-Nord
    expect(wahlkreisFuerStadtteil(15)).toBe("70"); // Drewer-Süd
    expect(wahlkreisFuerStadtteil(21)).toBe("70"); // Hüls-Nord
    expect(wahlkreisFuerStadtteil(22)).toBe("70"); // Hüls-Süd
    expect(wahlkreisFuerStadtteil(30)).toBe("70"); // Marl-Hamm
    expect(wahlkreisFuerStadtteil(40)).toBe("70"); // Chemiezone
    expect(wahlkreisFuerStadtteil(60)).toBe("70"); // Sinsen-Lenkerbeck
  });

  it("wirft bei unbekanntem Stadtteil", () => {
    expect(() => wahlkreisFuerStadtteil(99)).toThrow();
  });
});
