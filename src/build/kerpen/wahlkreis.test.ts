import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer", () => {
  it("ordnet die Kernstadt Kerpen Wahlkreis 7 zu", () => {
    expect(wahlkreisFuer("02.1")).toBe("7");
    expect(wahlkreisFuer("05.2")).toBe("7");
  });

  it("ordnet Balkhausen/Brüggen/Türnich Wahlkreis 7 zu", () => {
    expect(wahlkreisFuer("21.1")).toBe("7");
    expect(wahlkreisFuer("22.1")).toBe("7");
    expect(wahlkreisFuer("23.0")).toBe("7");
  });

  it("ordnet die übrigen Stadtbezirke Wahlkreis 6 zu", () => {
    expect(wahlkreisFuer("01.1")).toBe("6");
    expect(wahlkreisFuer("08.3")).toBe("6");
    expect(wahlkreisFuer("19.0")).toBe("6");
  });

  it("wirft bei einem unbekannten Präfix", () => {
    expect(() => wahlkreisFuer("99.1")).toThrow();
  });
});
