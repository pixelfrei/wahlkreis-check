import { describe, expect, it } from "vitest";
import { gladbeckZeileZuRohZeile, parseZeile } from "./parse.js";

describe("parseZeile", () => {
  it("erkennt eine bloße Straße ohne Hausnummern", () => {
    expect(parseZeile("Am Meyplatz")).toEqual({
      strasse: "Am Meyplatz",
      von: null,
      bis: null,
      par: null,
    });
  });

  it("erkennt einen Bereich mit Anfang/Ende-Platzhaltern", () => {
    expect(parseZeile("Friedenstr. Anfang - 26 gerade")).toEqual({
      strasse: "Friedenstr.",
      von: "Anfang",
      bis: "26",
      par: "gerade",
    });
    expect(parseZeile("Horster Str. 339 - Ende ungerade")).toEqual({
      strasse: "Horster Str.",
      von: "339",
      bis: "Ende",
      par: "ungerade",
    });
  });

  it("erkennt einen Bereich mit Zahlen auf beiden Seiten", () => {
    expect(parseZeile("Konrad-Adenauer-Allee 70 - 74 gerade")).toEqual({
      strasse: "Konrad-Adenauer-Allee",
      von: "70",
      bis: "74",
      par: "gerade",
    });
  });

  it("erhält mehrteilige Straßennamen mit Bindestrichen", () => {
    expect(parseZeile("August-Wessendorf-Weg")).toEqual({
      strasse: "August-Wessendorf-Weg",
      von: null,
      bis: null,
      par: null,
    });
  });
});

describe("gladbeckZeileZuRohZeile", () => {
  it("baut einen wk-Eintrag ohne Bereich für eine bloße Straße", () => {
    expect(gladbeckZeileZuRohZeile({ strasse: "Am Meyplatz", von: null, bis: null, par: null }, "73")).toEqual({
      von: null,
      bis: null,
      par: null,
      wk: "73",
    });
  });

  it("bildet Anfang auf 1 und Ende auf einen hohen Platzhalter ab", () => {
    expect(
      gladbeckZeileZuRohZeile(
        { strasse: "Friedenstr.", von: "Anfang", bis: "26", par: "gerade" },
        "73",
      ),
    ).toEqual({ von: 1, bis: 26, par: "g", wk: "73" });

    expect(
      gladbeckZeileZuRohZeile(
        { strasse: "Horster Str.", von: "339", bis: "Ende", par: "ungerade" },
        "75",
      ),
    ).toEqual({ von: 339, bis: 99999, par: "u", wk: "75" });
  });

  it("übernimmt konkrete Zahlen auf beiden Seiten unverändert", () => {
    expect(
      gladbeckZeileZuRohZeile(
        { strasse: "Konrad-Adenauer-Allee", von: "70", bis: "74", par: "gerade" },
        "73",
      ),
    ).toEqual({ von: 70, bis: 74, par: "g", wk: "73" });
  });
});
