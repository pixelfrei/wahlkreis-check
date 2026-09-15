import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer", () => {
  it("ordnet die Stadtbezirke West/Süd/Fischeln/Oppum-Linn Wahlkreis 48 zu", () => {
    expect(wahlkreisFuer("1")).toBe("48");
    expect(wahlkreisFuer("5")).toBe("48");
    expect(wahlkreisFuer("6")).toBe("48");
    expect(wahlkreisFuer("7")).toBe("48");
  });

  it("ordnet die Stadtbezirke Nord/Hüls/Mitte/Ost/Uerdingen Wahlkreis 49 zu", () => {
    expect(wahlkreisFuer("2")).toBe("49");
    expect(wahlkreisFuer("3")).toBe("49");
    expect(wahlkreisFuer("4")).toBe("49");
    expect(wahlkreisFuer("8")).toBe("49");
    expect(wahlkreisFuer("9")).toBe("49");
  });

  it("wirft bei einem unbekannten Stadtbezirk", () => {
    expect(() => wahlkreisFuer("10")).toThrow();
  });
});
