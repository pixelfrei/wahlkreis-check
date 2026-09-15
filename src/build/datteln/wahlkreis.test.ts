import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer", () => {
  it("ordnet Wahlbezirk 1 (Ahsen/Ostleven) Wahlkreis 71 zu", () => {
    expect(wahlkreisFuer("01.0")).toBe("71");
    expect(wahlkreisFuer("1.9")).toBe("71");
  });

  it("ordnet alle übrigen Wahlbezirke Wahlkreis 72 zu", () => {
    expect(wahlkreisFuer("02.0")).toBe("72");
    expect(wahlkreisFuer("19.0")).toBe("72");
  });

  it("wirft bei einem unbekannten Wahlbezirk", () => {
    expect(() => wahlkreisFuer("99.0")).toThrow();
  });
});
