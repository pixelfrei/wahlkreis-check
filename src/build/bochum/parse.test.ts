import { describe, expect, it } from "vitest";
import { parseAdresse } from "./parse.js";

describe("parseAdresse", () => {
  it("parst eine einfache Adresse ohne Buchstabenzusatz", () => {
    expect(parseAdresse("Achtermannstr. 1")).toEqual({
      strasse: "Achtermannstr.",
      hausnummer: 1,
      suffix: "",
    });
  });

  it("parst einen Buchstabenzusatz, durch Leerzeichen getrennt", () => {
    expect(parseAdresse("Adlerstr. 18 a")).toEqual({
      strasse: "Adlerstr.",
      hausnummer: 18,
      suffix: "a",
    });
  });

  it("gibt null zurück für eine Straße ohne Hausnummer", () => {
    expect(parseAdresse("Bahnhofstr.")).toBeNull();
    expect(parseAdresse("Auf dem Alten Kamp")).toBeNull();
  });

  it("erhält mehrteilige Straßennamen", () => {
    expect(parseAdresse("Albert-Schweitzer-Str. 10")).toEqual({
      strasse: "Albert-Schweitzer-Str.",
      hausnummer: 10,
      suffix: "",
    });
  });
});
