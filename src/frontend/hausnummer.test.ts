import { describe, expect, it } from "vitest";
import { parseEingabe } from "./hausnummer.js";

describe("parseEingabe", () => {
  it("liest 40, 40a, 40 a, 40A und Nr. 40a gleich", () => {
    expect(parseEingabe("40")).toEqual({ nummer: 40, zusatz: "" });
    expect(parseEingabe("40a")).toEqual({ nummer: 40, zusatz: "a" });
    expect(parseEingabe("40 a")).toEqual({ nummer: 40, zusatz: "a" });
    expect(parseEingabe("40A")).toEqual({ nummer: 40, zusatz: "A" });
    expect(parseEingabe("Nr. 40a")).toEqual({ nummer: 40, zusatz: "a" });
  });

  it("liefert null ohne Ziffern", () => {
    expect(parseEingabe("abc")).toBeNull();
    expect(parseEingabe("")).toBeNull();
  });
});
