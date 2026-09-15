import { describe, expect, it } from "vitest";
import {
  buchstabenAusZeilen,
  ergaenzeBuchstabenAusnahmen,
  pruefeBuchstaben,
  zusatzVon,
  type BuchstabenAdresse,
} from "./buchstabenPruefung.js";
import { BuildError, type RohZeile } from "./gruppierung.js";
import type { Strasse } from "../shared/types.js";

describe("zusatzVon", () => {
  it("liest den Buchstabenzusatz unabhängig von Schreibweise und Nullen", () => {
    expect(zusatzVon("015b")).toBe("b");
    expect(zusatzVon("53 A")).toBe("a");
    expect(zusatzVon("94")).toBe("");
  });
});

// Dortmund, Schilfweg: 15 und 15a gehören zu WK 114, ab 15b beginnt WK 113.
function schilfweg(): { zeilen: Map<string, RohZeile[]>; strassen: Strasse[] } {
  return {
    zeilen: new Map([
      [
        "Schilfweg",
        [
          { von: 1, bis: 15, par: "u", wk: "114", buchstaben: [{ nummer: 15, zusatz: "a" }] },
          { von: 17, bis: 29, par: "u", wk: "113", buchstaben: [{ nummer: 15, zusatz: "b", ab: true }] },
        ],
      ],
    ]),
    strassen: [
      {
        n: "Schilfweg",
        b: [
          { von: 1, bis: 15, par: "u", wk: "114" },
          { von: 17, bis: 29, par: "u", wk: "113" },
        ],
      },
    ],
  };
}

describe("pruefeBuchstaben", () => {
  it("findet Adressen, für die die App einen falschen oder keinen Wahlkreis anzeigt", () => {
    const { zeilen, strassen } = schilfweg();
    const bericht = pruefeBuchstaben("Test", buchstabenAusZeilen(zeilen), strassen);

    expect(bericht.geprueft).toBe(2);
    expect(bericht.falsch).toEqual([
      { strasse: "Schilfweg", nummer: 15, zusatz: "b", ab: true, wk: "113", app: "114" },
    ]);
  });

  it("meldet unbekannte Straßen", () => {
    const { strassen } = schilfweg();
    const bericht = pruefeBuchstaben(
      "Test",
      [{ strasse: "Gibtsnicht", nummer: 1, zusatz: "a", wk: "113" }],
      strassen,
    );
    expect(bericht.strasseNichtGefunden).toBe(1);
  });
});

describe("ergaenzeBuchstabenAusnahmen", () => {
  it("ergänzt eine Ausnahme ab dem Buchstaben einer Bereichsgrenze", async () => {
    const { zeilen, strassen } = schilfweg();
    const nachher = await ergaenzeBuchstabenAusnahmen("Test", buchstabenAusZeilen(zeilen), strassen);

    expect(strassen[0]!.z).toEqual([{ nr: 15, von: "b", bis: "z", wk: "113" }]);
    expect(nachher.falsch).toEqual([]);
  });

  it("fasst aufeinanderfolgende einzelne Buchstaben zusammen und lässt Lücken stehen", async () => {
    // Bochum, Hermannshöhe: 5 und 5a in 108, 5b-5g und 5j in 109
    const strassen: Strasse[] = [{ n: "Hermannshöhe", wk: "108" }];
    const adressen: BuchstabenAdresse[] = ["a", "b", "c", "d", "e", "f", "g", "j"].map((zusatz) => ({
      strasse: "Hermannshöhe",
      nummer: 5,
      zusatz,
      wk: zusatz === "a" ? "108" : "109",
    }));

    await ergaenzeBuchstabenAusnahmen("Test", adressen, strassen);

    expect(strassen[0]!.z).toEqual([
      { nr: 5, von: "b", bis: "g", wk: "109" },
      { nr: 5, von: "j", bis: "j", wk: "109" },
    ]);
  });

  it("verengt eine Ausnahme, wenn spätere Buchstaben wieder woanders liegen", async () => {
    const strassen: Strasse[] = [{ n: "Teststraße", b: [{ von: 1, bis: 9, par: "u", wk: "1" }] }];
    const adressen: BuchstabenAdresse[] = [
      { strasse: "Teststraße", nummer: 7, zusatz: "b", ab: true, wk: "2" },
      { strasse: "Teststraße", nummer: 7, zusatz: "d", wk: "1" },
    ];

    await ergaenzeBuchstabenAusnahmen("Test", adressen, strassen);

    expect(pruefeBuchstaben("Test", adressen, strassen).falsch).toEqual([]);
  });

  it("bricht bei widersprüchlichen Quelldaten ab", async () => {
    const strassen: Strasse[] = [{ n: "Teststraße", wk: "1" }];
    const adressen: BuchstabenAdresse[] = [
      { strasse: "Teststraße", nummer: 3, zusatz: "a", wk: "2" },
      { strasse: "Teststraße", nummer: 3, zusatz: "a", wk: "3" },
    ];

    await expect(ergaenzeBuchstabenAusnahmen("Test", adressen, strassen)).rejects.toThrow(BuildError);
  });
});
