import { describe, expect, it } from "vitest";
import { BuildError } from "../gruppierung.js";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer", () => {
  it("löst ganze Stadtbezirke unabhängig vom Stadtteil auf", () => {
    expect(wahlkreisFuer("01", "Altstadt")).toBe("41");
    expect(wahlkreisFuer("01", "Golzheim")).toBe("41");
    expect(wahlkreisFuer("09", "Benrath")).toBe("44");
  });

  it("löst den geteilten Bezirk 6 nach Stadtteil auf", () => {
    expect(wahlkreisFuer("06", "Lichtenbroich")).toBe("41");
    expect(wahlkreisFuer("06", "Unterrath")).toBe("41");
    expect(wahlkreisFuer("06", "Mörsenbroich")).toBe("41");
    expect(wahlkreisFuer("06", "Rath")).toBe("42");
  });

  it("löst den geteilten Bezirk 8 nach Stadtteil auf", () => {
    expect(wahlkreisFuer("08", "Lierenfeld")).toBe("42");
    expect(wahlkreisFuer("08", "Eller")).toBe("42");
    expect(wahlkreisFuer("08", "Vennhausen")).toBe("44");
    expect(wahlkreisFuer("08", "Unterbach")).toBe("44");
  });

  it("wirft bei unbekanntem Stadtbezirk oder Stadtteil", () => {
    expect(() => wahlkreisFuer("99", "Nirgendwo")).toThrow(BuildError);
    expect(() => wahlkreisFuer("06", "Nirgendwo")).toThrow(BuildError);
  });
});
