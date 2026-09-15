import { describe, expect, it } from "vitest";
import type { StrassenverzeichnisRecord, WahlraumRecord } from "../shared/types.js";
import { BuildError, buildStrassen } from "./join.js";

function strassenRow(
  overrides: Partial<StrassenverzeichnisRecord>,
): StrassenverzeichnisRecord {
  return {
    strasse: "TESTSTRAßE",
    hausnummernbereich: null,
    hausnummer_von: null,
    hausnummer_bis: null,
    stimmbezirk: "00001",
    kommune: "Dortmund",
    ...overrides,
  };
}

function wahlraumRow(overrides: Partial<WahlraumRecord>): WahlraumRecord {
  return {
    stimmbezirk: "00001",
    landtagswahlkreis_nr: "111",
    landtagswahlkreis: "111 Dortmund I",
    ...overrides,
  };
}

const WAHLRAEUME: WahlraumRecord[] = [
  wahlraumRow({ stimmbezirk: "1101", landtagswahlkreis_nr: "111", landtagswahlkreis: "111 Dortmund I" }),
  wahlraumRow({ stimmbezirk: "1102", landtagswahlkreis_nr: "112", landtagswahlkreis: "112 Dortmund II" }),
  wahlraumRow({ stimmbezirk: "1103", landtagswahlkreis_nr: "113", landtagswahlkreis: "113 Dortmund III" }),
  wahlraumRow({ stimmbezirk: "1104", landtagswahlkreis_nr: "114", landtagswahlkreis: "114 Dortmund IV" }),
];

describe("buildStrassen", () => {
  it("baut eine eindeutige Straße ohne Bereiche", () => {
    const { strassen } = buildStrassen(
      [strassenRow({ strasse: "ABBOWEG", stimmbezirk: "1101" })],
      WAHLRAEUME,
    );
    expect(strassen).toEqual([{ n: "ABBOWEG", wk: "111" }]);
  });

  it("baut eine geteilte Straße mit Bereichen und Parität", () => {
    const { strassen } = buildStrassen(
      [
        strassenRow({
          strasse: "ARDEYSTRAßE",
          hausnummer_von: "067",
          hausnummer_bis: "095",
          stimmbezirk: "1101",
        }),
        strassenRow({
          strasse: "ARDEYSTRAßE",
          hausnummer_von: "002",
          hausnummer_bis: "064",
          stimmbezirk: "1102",
        }),
      ],
      WAHLRAEUME,
    );
    expect(strassen).toEqual([
      {
        n: "ARDEYSTRAßE",
        b: [
          { von: 2, bis: 64, par: "g", wk: "112" },
          { von: 67, bis: 95, par: "u", wk: "111" },
        ],
      },
    ]);
  });

  it("fasst angrenzende Bereiche gleichen Wahlkreises zusammen", () => {
    const { strassen } = buildStrassen(
      [
        strassenRow({ strasse: "MERGESTRAßE", hausnummer_von: "002", hausnummer_bis: "040", stimmbezirk: "1101" }),
        strassenRow({ strasse: "MERGESTRAßE", hausnummer_von: "042", hausnummer_bis: "080", stimmbezirk: "1101" }),
      ],
      WAHLRAEUME,
    );
    // beide Bereiche sind gerade, gleicher Wahlkreis, 40 + 2 == 42 -> angrenzend
    expect(strassen).toEqual([{ n: "MERGESTRAßE", wk: "111" }]);
  });

  it("bildet den Groppenbrucher-Fall mit Warnung und Vermutung ab", () => {
    const { strassen, zeilenOhneStimmbezirk } = buildStrassen(
      [
        strassenRow({ strasse: "GROPPENBRUCHER STRAßE", hausnummer_von: "002", hausnummer_bis: "194", stimmbezirk: "1101" }),
        strassenRow({ strasse: "GROPPENBRUCHER STRAßE", hausnummer_von: "003", hausnummer_bis: "177", stimmbezirk: "1101" }),
        strassenRow({ strasse: "GROPPENBRUCHER STRAßE", hausnummer_von: "181", hausnummer_bis: "187", stimmbezirk: "1101" }),
        strassenRow({ strasse: "GROPPENBRUCHER STRAßE", hausnummer_von: "179", hausnummer_bis: "179", stimmbezirk: null }),
      ],
      WAHLRAEUME,
    );

    expect(zeilenOhneStimmbezirk).toEqual([
      { strasse: "GROPPENBRUCHER STRAßE", hausnummernbereich: null },
    ]);

    const strasse = strassen.find((s) => s.n === "GROPPENBRUCHER STRAßE");
    expect(strasse).toBeDefined();
    expect("b" in strasse! && strasse.b).toEqual([
      { von: 2, bis: 194, par: "g", wk: "111" },
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
    ]);
  });

  it("behandelt Buchstabenzusatz an der von-Grenze als Beginn danach (Schilfweg-Fall)", () => {
    // reale Daten: "003 - 015a" (Wahlkreis A) und "015b - 019a" (Wahlkreis B).
    // Die Basisnummer 15 gehört zum ersten Bereich, nicht zu beiden.
    const { strassen } = buildStrassen(
      [
        strassenRow({ strasse: "SCHILFWEG", hausnummer_von: "003", hausnummer_bis: "015a", stimmbezirk: "1101" }),
        strassenRow({ strasse: "SCHILFWEG", hausnummer_von: "015b", hausnummer_bis: "019a", stimmbezirk: "1102" }),
      ],
      WAHLRAEUME,
    );
    const strasse = strassen.find((s) => s.n === "SCHILFWEG");
    expect("b" in strasse! && strasse.b).toEqual([
      { von: 3, bis: 15, par: "u", wk: "111" },
      { von: 16, bis: 19, par: "u", wk: "112" },
    ]);
  });

  it("wirft, wenn ein Stimmbezirk im Wahlraumverzeichnis fehlt", () => {
    expect(() =>
      buildStrassen(
        [strassenRow({ strasse: "UNBEKANNT", stimmbezirk: "99999" })],
        WAHLRAEUME,
      ),
    ).toThrow(BuildError);
  });
});
