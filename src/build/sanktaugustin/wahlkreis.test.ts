import { describe, expect, it } from "vitest";
import { wahlkreisFuerGemarkung } from "./wahlkreis.js";

describe("wahlkreisFuerGemarkung (Sankt Augustin)", () => {
  it("ordnet Nieder-/Obermenden Wahlkreis 28 zu", () => {
    expect(wahlkreisFuerGemarkung("Niedermenden")).toBe("28");
    expect(wahlkreisFuerGemarkung("Obermenden")).toBe("28");
  });

  it("ordnet die übrigen sechs Gemarkungen Wahlkreis 29 zu", () => {
    expect(wahlkreisFuerGemarkung("Hangelar")).toBe("29");
    expect(wahlkreisFuerGemarkung("Niederpleis")).toBe("29");
    expect(wahlkreisFuerGemarkung("Siegburg-Mülldorf")).toBe("29");
    expect(wahlkreisFuerGemarkung("Birlinghoven")).toBe("29");
    expect(wahlkreisFuerGemarkung("Buisdorf")).toBe("29");
    expect(wahlkreisFuerGemarkung("Meindorf")).toBe("29");
  });

  it("wirft bei unbekannter Gemarkung", () => {
    expect(() => wahlkreisFuerGemarkung("Nirgendwo")).toThrow();
  });
});
