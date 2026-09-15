import { describe, expect, it } from "vitest";
import { buchstabenAusZeilen, pruefeBuchstaben, zusatzVon } from "./buchstabenPruefung.js";
import type { RohZeile } from "./gruppierung.js";
import type { Strasse } from "../shared/types.js";

describe("zusatzVon", () => {
  it("liest den Buchstabenzusatz unabhängig von Schreibweise und Nullen", () => {
    expect(zusatzVon("015b")).toBe("b");
    expect(zusatzVon("53 A")).toBe("a");
    expect(zusatzVon("94")).toBe("");
  });
});

describe("pruefeBuchstaben", () => {
  // Dortmund, Schilfweg: 15 gehört zu WK 114, ab 15b beginnt WK 113.
  const zeilen = new Map<string, RohZeile[]>([
    [
      "Schilfweg",
      [
        { von: 1, bis: 15, par: "u", wk: "114", buchstaben: [{ nummer: 15, zusatz: "a" }] },
        { von: 17, bis: 29, par: "u", wk: "113", buchstaben: [{ nummer: 15, zusatz: "b" }] },
      ],
    ],
    ["Baukamp", [{ von: 88, bis: 90, par: "g", wk: "113", buchstaben: [{ nummer: 86, zusatz: "b" }] }]],
  ]);
  const strassen: Strasse[] = [
    {
      n: "Schilfweg",
      b: [
        { von: 1, bis: 15, par: "u", wk: "114" },
        { von: 17, bis: 29, par: "u", wk: "113" },
      ],
    },
    {
      n: "Baukamp",
      b: [
        { von: 88, bis: 90, par: "g", wk: "113" },
        { von: 1, bis: 9, par: "u", wk: "112" },
      ],
    },
  ];

  it("findet Adressen, für die die App einen falschen oder keinen Wahlkreis anzeigt", () => {
    const bericht = pruefeBuchstaben("Test", buchstabenAusZeilen(zeilen), strassen);

    expect(bericht.geprueft).toBe(3);
    expect(bericht.falsch).toEqual([
      { strasse: "Schilfweg", nummer: 15, zusatz: "b", wk: "113", app: "114" },
    ]);
    expect(bericht.keinTreffer).toEqual([
      { strasse: "Baukamp", nummer: 86, zusatz: "b", wk: "113", app: null },
    ]);
  });

  it("zählt Adressen doppelt vorkommender Zeilen nur einmal und meldet unbekannte Straßen", () => {
    const adressen = [
      { strasse: "Schilfweg", nummer: 15, zusatz: "b", wk: "113" },
      { strasse: "Schilfweg", nummer: 15, zusatz: "b", wk: "113" },
      { strasse: "Gibtsnicht", nummer: 1, zusatz: "a", wk: "113" },
    ];
    const bericht = pruefeBuchstaben("Test", adressen, strassen);

    expect(bericht.geprueft).toBe(1);
    expect(bericht.strasseNichtGefunden).toBe(1);
  });
});
