import { describe, expect, it } from "vitest";
import type { Strasse } from "../shared/types.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "./validate.js";

describe("checkWahlkreisCount", () => {
  it("akzeptiert die erwartete Anzahl Wahlkreise", () => {
    expect(() =>
      checkWahlkreisCount({ "111": "a", "112": "b", "113": "c", "114": "d" }, 4),
    ).not.toThrow();
  });

  it("wirft bei einer anderen Anzahl", () => {
    expect(() => checkWahlkreisCount({ "111": "a" }, 4)).toThrow();
  });
});

describe("runVollscan", () => {
  it("liefert 002 - 080 trifft 40, trifft nicht 41 in einem anderen Wahlkreis", () => {
    const strassen: Strasse[] = [
      {
        n: "PARITAETSTRAßE",
        b: [
          { von: 2, bis: 80, par: "g", wk: "111" },
          { von: 3, bis: 41, par: "u", wk: "112" },
        ],
      },
    ];
    expect(runVollscan(strassen)).toEqual([]);
  });

  it("erkennt echte Mehrdeutigkeit bei überlappenden Bereichen gleicher Parität", () => {
    const strassen: Strasse[] = [
      {
        n: "KONFLIKTSTRAßE",
        b: [
          { von: 2, bis: 40, par: "g", wk: "111" },
          { von: 30, bis: 60, par: "g", wk: "112" },
        ],
      },
    ];
    const conflicts = runVollscan(strassen);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0]!.strasse).toBe("KONFLIKTSTRAßE");
  });

  it("ignoriert Bereiche mit wk:null (Vermutungen) bei der Konfliktprüfung", () => {
    const strassen: Strasse[] = [
      {
        n: "UNKLARSTRAßE",
        b: [
          { von: 3, bis: 177, par: "u", wk: "111" },
          { von: 179, bis: 179, par: "u", wk: null, vermutung: "111", grund: "x" },
          { von: 181, bis: 187, par: "u", wk: "111" },
        ],
      },
    ];
    expect(runVollscan(strassen)).toEqual([]);
  });
});

describe("findGaps", () => {
  it("findet eine Lücke zwischen zwei Bereichen derselben Seite", () => {
    const strassen: Strasse[] = [
      {
        n: "LUECKENSTRAßE",
        b: [
          { von: 2, bis: 10, par: "g", wk: "111" },
          { von: 20, bis: 30, par: "g", wk: "111" },
        ],
      },
    ];
    const gaps = findGaps(strassen);
    expect(gaps).toEqual([{ strasse: "LUECKENSTRAßE", von: 12, bis: 18 }]);
  });

  it("findet keine Lücke bei direkt angrenzenden Bereichen", () => {
    const strassen: Strasse[] = [
      {
        n: "OKSTRAßE",
        b: [
          { von: 2, bis: 10, par: "g", wk: "111" },
          { von: 12, bis: 20, par: "g", wk: "112" },
        ],
      },
    ];
    expect(findGaps(strassen)).toEqual([]);
  });
});
