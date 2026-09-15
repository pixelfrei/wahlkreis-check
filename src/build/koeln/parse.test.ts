import { describe, expect, it } from "vitest";
import { koelnZeileZuRohZeilen } from "./parse.js";

describe("koelnZeileZuRohZeilen", () => {
  it("baut beide Bereiche, wenn ungerade und gerade auf derselben Zeile stehen", () => {
    const result = koelnZeileZuRohZeilen({
      strasse: "Aachener Str.",
      landtag: "13",
      ungeradeVon: "1",
      ungeradeBis: "59",
      geradeVon: "2",
      geradeBis: "72",
    });
    expect(result).toEqual([
      { von: 1, bis: 59, par: "u", wk: "13" },
      { von: 2, bis: 72, par: "g", wk: "13" },
    ]);
  });

  it("baut nur den vorhandenen Bereich, wenn nur eine Seite gesetzt ist", () => {
    const result = koelnZeileZuRohZeilen({
      strasse: "Beispielweg",
      landtag: "14",
      ungeradeVon: "3",
      ungeradeBis: "15",
      geradeVon: null,
      geradeBis: null,
    });
    expect(result).toEqual([{ von: 3, bis: 15, par: "u", wk: "14" }]);
  });

  it("behandelt Buchstabenzusatz an der unteren Grenze wie bei Dortmund", () => {
    // reales Beispiel: "Akazienstr." 60703, gerade von "2a" bis "60"
    const result = koelnZeileZuRohZeilen({
      strasse: "Akazienstr.",
      landtag: "16",
      ungeradeVon: null,
      ungeradeBis: null,
      geradeVon: "2a",
      geradeBis: "60",
    });
    expect(result).toEqual([
      { von: 3, bis: 60, par: "g", wk: "16", buchstaben: [{ nummer: 2, zusatz: "a", ab: true }] },
    ]);
  });

  it("liefert eine leere Liste, wenn keine Seite gesetzt ist", () => {
    expect(
      koelnZeileZuRohZeilen({
        strasse: "X",
        landtag: "13",
        ungeradeVon: null,
        ungeradeBis: null,
        geradeVon: null,
        geradeBis: null,
      }),
    ).toEqual([]);
  });
});
