import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer", () => {
  it("ordnet normale Kommunalwahlbezirke ohne Stimmbezirk-Sonderfall zu", () => {
    expect(wahlkreisFuer("011")).toBe("30"); // 01 Bonn-Zentrum
    expect(wahlkreisFuer("371")).toBe("30"); // 37 Vilich/Geislar/Vilich-Müldorf
    expect(wahlkreisFuer("125")).toBe("31"); // 12 Dottendorf/Gronau
    expect(wahlkreisFuer("412")).toBe("31"); // 41 Lengsdorf/Brüser Berg
  });

  it("teilt Kommunalwahlbezirk 14 (Endenich II) nach Stimmbezirk", () => {
    expect(wahlkreisFuer("141")).toBe("30");
    expect(wahlkreisFuer("142")).toBe("30");
    expect(wahlkreisFuer("144")).toBe("30");
    expect(wahlkreisFuer("143")).toBe("31");
    expect(wahlkreisFuer("145")).toBe("31");
  });

  it("wirft bei einem unbekannten Kommunalwahlbezirk", () => {
    expect(() => wahlkreisFuer("991")).toThrow();
  });
});
