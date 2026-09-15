import { describe, expect, it } from "vitest";
import type { Strasse } from "../shared/types.js";
import { brauchtHausnummer, ergebnisFuer } from "./lookup.js";

describe("ergebnisFuer", () => {
  it("gibt bei eindeutiger Straße sofort den Wahlkreis zurück", () => {
    const strasse: Strasse = { n: "ABBOWEG", wk: "111" };
    expect(ergebnisFuer(strasse, null)).toEqual({ art: "eindeutig", wk: "111" });
    expect(ergebnisFuer(strasse, 5)).toEqual({ art: "eindeutig", wk: "111" });
  });

  it("zeigt die Übersicht, solange keine Hausnummer eingegeben ist", () => {
    const strasse: Strasse = {
      n: "ARDEYSTRAßE",
      b: [
        { von: 2, bis: 64, par: "g", wk: "112" },
        { von: 67, bis: 95, par: "u", wk: "111" },
      ],
    };
    const result = ergebnisFuer(strasse, null);
    expect(result.art).toBe("uebersicht");
  });

  it("liefert 002-080 trifft 40, trifft nicht 41 in anderem Wahlkreis", () => {
    const strasse: Strasse = {
      n: "TESTSTRAßE",
      b: [
        { von: 2, bis: 80, par: "g", wk: "111" },
        { von: 1, bis: 41, par: "u", wk: "112" },
      ],
    };
    expect(ergebnisFuer(strasse, 40)).toEqual({ art: "treffer", wk: "111" });
    expect(ergebnisFuer(strasse, 41)).toEqual({ art: "treffer", wk: "112" });
  });

  it("meldet kein-treffer außerhalb der Bereiche", () => {
    const strasse: Strasse = {
      n: "TESTSTRAßE",
      b: [{ von: 2, bis: 80, par: "g", wk: "111" }],
    };
    const result = ergebnisFuer(strasse, 200);
    expect(result.art).toBe("kein-treffer");
  });

  it("liefert die Vermutung beim Groppenbrucher-Fall", () => {
    const strasse: Strasse = {
      n: "GROPPENBRUCHER STRAßE",
      b: [
        { von: 3, bis: 177, par: "u", wk: "111" },
        {
          von: 179,
          bis: 179,
          par: "u",
          wk: null,
          vermutung: "111",
          grund: "Nachbarbereiche 3-177 und 181-187 in 111",
        },
        { von: 181, bis: 187, par: "u", wk: "111" },
      ],
    };
    expect(ergebnisFuer(strasse, 179)).toEqual({
      art: "vermutung",
      vermutung: "111",
      grund: "Nachbarbereiche 3-177 und 181-187 in 111",
    });
  });
});

describe("Buchstaben-Ausnahmen", () => {
  it("löst Hausnummern mit Buchstaben über die Ausnahme auf, ohne Buchstaben über den Bereich", () => {
    // Dortmund, Schilfweg: 15 gehört zu 114, ab 15b beginnt 113
    const strasse: Strasse = {
      n: "SCHILFWEG",
      b: [
        { von: 1, bis: 15, par: "u", wk: "114" },
        { von: 17, bis: 29, par: "u", wk: "113" },
      ],
      z: [{ nr: 15, von: "b", bis: "z", wk: "113" }],
    };
    expect(ergebnisFuer(strasse, 15)).toEqual({ art: "treffer", wk: "114" });
    expect(ergebnisFuer(strasse, 15, "a")).toEqual({ art: "treffer", wk: "114" });
    expect(ergebnisFuer(strasse, 15, "b")).toEqual({ art: "treffer", wk: "113" });
    expect(ergebnisFuer(strasse, 15, " C")).toEqual({ art: "treffer", wk: "113" });
  });

  it("verlangt bei sonst eindeutiger Straße mit Ausnahmen eine Hausnummer", () => {
    // Bielefeld, Holbeinstraße: alles 94, nur 2a liegt in 92
    const strasse: Strasse = { n: "Holbeinstraße", wk: "94", z: [{ nr: 2, von: "a", bis: "a", wk: "92" }] };
    expect(brauchtHausnummer(strasse)).toBe(true);
    expect(ergebnisFuer(strasse, null)).toEqual({ art: "uebersicht", bereiche: [] });
    expect(ergebnisFuer(strasse, 2)).toEqual({ art: "treffer", wk: "94" });
    expect(ergebnisFuer(strasse, 2, "a")).toEqual({ art: "treffer", wk: "92" });
    expect(ergebnisFuer(strasse, 2, "b")).toEqual({ art: "treffer", wk: "94" });
  });

  it("bevorzugt die engere Ausnahme", () => {
    const strasse: Strasse = {
      n: "Teststraße",
      wk: "1",
      z: [
        { nr: 7, von: "b", bis: "z", wk: "2" },
        { nr: 7, von: "d", bis: "d", wk: "3" },
      ],
    };
    expect(ergebnisFuer(strasse, 7, "c")).toEqual({ art: "treffer", wk: "2" });
    expect(ergebnisFuer(strasse, 7, "d")).toEqual({ art: "treffer", wk: "3" });
  });
});
