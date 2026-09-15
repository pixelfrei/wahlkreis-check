import { describe, expect, it } from "vitest";
import { paritaetOf, parseHausnummer, zfill5 } from "./parse.js";

describe("zfill5", () => {
  it("füllt kurze Stimmbezirke auf 5 Stellen auf", () => {
    expect(zfill5("9106")).toBe("09106");
    expect(zfill5("1107")).toBe("01107");
  });

  it("lässt bereits 5-stellige Werte unverändert", () => {
    expect(zfill5("41101")).toBe("41101");
  });
});

describe("parseHausnummer", () => {
  it("liest reine Ziffern", () => {
    expect(parseHausnummer("002")).toBe(2);
    expect(parseHausnummer("080")).toBe(80);
  });

  it("ignoriert Buchstabenzusätze für den numerischen Teil", () => {
    expect(parseHausnummer("012a")).toBe(12);
    expect(parseHausnummer("049b")).toBe(49);
  });

  it("wirft ohne führende Ziffer", () => {
    expect(() => parseHausnummer("a12")).toThrow();
  });
});

describe("paritaetOf", () => {
  it("erkennt gerade Bereiche", () => {
    expect(paritaetOf(2, 80)).toBe("g");
  });

  it("erkennt ungerade Bereiche", () => {
    expect(paritaetOf(3, 31)).toBe("u");
  });

  it("erkennt beide Seiten bei unterschiedlicher Parität", () => {
    expect(paritaetOf(3, 4)).toBe("b");
  });
});
