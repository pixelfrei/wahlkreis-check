import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer (Wuppertal)", () => {
  it("ordnet Barmens WK32-Kommunalwahlbezirke korrekt zu", () => {
    expect(wahlkreisFuer(51)).toBe("32"); // Barmen-Mitte
    expect(wahlkreisFuer(53)).toBe("32"); // Loh-Unterbarmen
  });

  it("ordnet Barmens WK33-Kommunalwahlbezirke korrekt zu", () => {
    expect(wahlkreisFuer(52)).toBe("33"); // Sedansberg-Rott
    expect(wahlkreisFuer(54)).toBe("33"); // Clausen-Hatzfeld
    expect(wahlkreisFuer(55)).toBe("33"); // Kothen-Lichtenplatz
  });

  it("ordnet Elberfelds WK33-Kommunalwahlbezirke korrekt zu", () => {
    expect(wahlkreisFuer(1)).toBe("33"); // Elberfeld-Mitte
    expect(wahlkreisFuer(5)).toBe("33"); // Grifflenberg
  });

  it("ordnet Elberfelds WK34-Kommunalwahlbezirk (Friedrichsberg) korrekt zu", () => {
    expect(wahlkreisFuer(6)).toBe("34");
  });

  it("ordnet komplett zugeordnete Stadtbezirke korrekt zu", () => {
    expect(wahlkreisFuer(61)).toBe("32"); // Oberbarmen
    expect(wahlkreisFuer(91)).toBe("32"); // Ronsdorf
    expect(wahlkreisFuer(21)).toBe("33"); // Uellendahl-Katernberg
    expect(wahlkreisFuer(11)).toBe("34"); // Elberfeld-West
    expect(wahlkreisFuer(31)).toBe("34"); // Vohwinkel
    expect(wahlkreisFuer(41)).toBe("34"); // Cronenberg
  });

  it("wirft bei unbekanntem Kommunalwahlbezirk", () => {
    expect(() => wahlkreisFuer(99)).toThrow();
  });
});
