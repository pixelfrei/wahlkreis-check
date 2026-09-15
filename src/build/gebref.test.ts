import { describe, expect, it } from "vitest";
import { parseGebrefZeile } from "./gebref.js";

describe("parseGebrefZeile", () => {
  it("parst eine vollständige Adresszeile", () => {
    expect(
      parseGebrefZeile(
        "N;DENW52HK000AAamr;C;05;Nordrhein-Westfalen;5;Münster;62;Recklinghausen;024;Marl;0000;;07146;Polsumer Straße;2;;32;365471.472;5721550.800;2026-07-01",
      ),
    ).toEqual({
      strasse: "Polsumer Straße",
      hausnummer: 2,
      suffix: "",
      punkt: [365471.472, 5721550.8],
    });
  });

  it("liest einen Buchstabenzusatz", () => {
    const zeile = parseGebrefZeile(
      "N;DENW08HK0000ChHB;A;05;Nordrhein-Westfalen;9;Arnsberg;62;Märkischer Kreis;052;Plettenberg;0000;;02418;Marl;2;a;32;420565.275;5673959.771;2026-07-01",
    );
    expect(zeile?.suffix).toBe("a");
    expect(zeile?.hausnummer).toBe(2);
  });

  it("gibt null zurück ohne numerische Hausnummer", () => {
    expect(
      parseGebrefZeile(
        "N;DENW00HKxxx;A;05;Nordrhein-Westfalen;5;Münster;62;Recklinghausen;024;Marl;0000;;01234;Kreisverkehr;;;32;1.0;2.0;2026-07-01",
      ),
    ).toBeNull();
  });
});
