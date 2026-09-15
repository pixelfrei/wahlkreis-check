import { describe, expect, it } from "vitest";
import { wahlkreisFuerGemarkung } from "./wahlkreis.js";

describe("wahlkreisFuerGemarkung (Altenbeken)", () => {
  it("ordnet die Gemarkung Altenbeken Wahlkreis 101 zu", () => {
    expect(wahlkreisFuerGemarkung("Altenbeken")).toBe("101");
  });

  it("ordnet Buke und Schwaney Wahlkreis 100 zu", () => {
    expect(wahlkreisFuerGemarkung("Buke")).toBe("100");
    expect(wahlkreisFuerGemarkung("Schwaney")).toBe("100");
  });

  it("wirft bei unbekannter Gemarkung", () => {
    expect(() => wahlkreisFuerGemarkung("Nirgendwo")).toThrow();
  });
});
