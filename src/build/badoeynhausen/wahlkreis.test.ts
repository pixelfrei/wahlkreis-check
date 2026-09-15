import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer", () => {
  it("ordnet Lohe/Bad Oeynhausen/Rehme (Bezirke 010-110) Wahlkreis 89 zu", () => {
    expect(wahlkreisFuer("010")).toBe("89");
    expect(wahlkreisFuer("070")).toBe("89");
    expect(wahlkreisFuer("110")).toBe("89");
  });

  it("ordnet die übrigen Stadtteile (Bezirke 120-220) Wahlkreis 91 zu", () => {
    expect(wahlkreisFuer("120")).toBe("91");
    expect(wahlkreisFuer("220")).toBe("91");
  });

  it("wirft bei einer unbekannten Bezirk-Nr", () => {
    expect(() => wahlkreisFuer("999")).toThrow();
  });
});
