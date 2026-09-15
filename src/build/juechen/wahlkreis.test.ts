import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer", () => {
  it("ordnet die Kommunalwahlbezirke 14-17 Wahlkreis 46 zu", () => {
    expect(wahlkreisFuer("0141")).toBe("46");
    expect(wahlkreisFuer("0151")).toBe("46");
    expect(wahlkreisFuer("0171")).toBe("46");
  });

  it("ordnet die übrigen Kommunalwahlbezirke Wahlkreis 47 zu", () => {
    expect(wahlkreisFuer("0011")).toBe("47");
    expect(wahlkreisFuer("0131")).toBe("47");
    expect(wahlkreisFuer("0181")).toBe("47");
    expect(wahlkreisFuer("0191")).toBe("47");
  });

  it("ordnet einen zweiten Stimmbezirk demselben Kommunalwahlbezirk zu", () => {
    expect(wahlkreisFuer("0062")).toBe(wahlkreisFuer("0061"));
    expect(wahlkreisFuer("0182")).toBe(wahlkreisFuer("0181"));
  });

  it("wirft bei einem unbekannten Kommunalwahlbezirk", () => {
    expect(() => wahlkreisFuer("0999")).toThrow();
  });
});
