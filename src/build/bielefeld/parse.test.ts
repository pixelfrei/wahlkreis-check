import { describe, expect, it } from "vitest";
import { parseHausnummer } from "./parse.js";

describe("parseHausnummer", () => {
  it("parst eine Hausnummer ohne Buchstabenzusatz", () => {
    expect(parseHausnummer("10")).toEqual({ hausnummer: 10, suffix: "" });
  });

  it("parst einen Buchstabenzusatz, durch Leerzeichen getrennt", () => {
    expect(parseHausnummer("15 a")).toEqual({ hausnummer: 15, suffix: "a" });
  });

  it("gibt null zurück bei unbekanntem Format", () => {
    expect(parseHausnummer("")).toBeNull();
    expect(parseHausnummer("ohne")).toBeNull();
  });
});
