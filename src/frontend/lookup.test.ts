import { describe, expect, it } from "vitest";
import type { Strasse } from "../shared/types.js";
import { ergebnisFuer } from "./lookup.js";

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
