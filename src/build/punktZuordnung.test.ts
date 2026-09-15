import { describe, expect, it } from "vitest";
import { baueBenanntesPolygonAusRingen } from "./geo.js";
import { ordneAdressenZu, type AdressPunkt } from "./punktZuordnung.js";

const QUADRAT_A = baueBenanntesPolygonAusRingen("A", [
  [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ],
]);
const QUADRAT_B = baueBenanntesPolygonAusRingen("B", [
  [
    [10, 0],
    [20, 0],
    [20, 10],
    [10, 10],
    [10, 0],
  ],
]);

const wahlkreisFuer = (name: string): string => (name === "A" ? "wk1" : "wk2");

describe("ordneAdressenZu", () => {
  it("ordnet eindeutige Punkte ihrem Wahlkreis zu", () => {
    const punkte: AdressPunkt[] = [
      { strasse: "Teststr.", hausnummer: 1, suffix: "", punkt: [5, 5] },
      { strasse: "Teststr.", hausnummer: 2, suffix: "", punkt: [15, 5] },
    ];
    const { byStrasse, ohneTreffer, mehrdeutig } = ordneAdressenZu(
      punkte,
      [QUADRAT_A, QUADRAT_B],
      wahlkreisFuer,
    );
    expect(ohneTreffer).toBe(0);
    expect(mehrdeutig).toBe(0);
    expect(byStrasse.get("Teststr.")).toEqual(
      new Map([
        [1, "wk1"],
        [2, "wk2"],
      ]),
    );
  });

  it("zählt Punkte außerhalb jedes Polygons als ohneTreffer", () => {
    const punkte: AdressPunkt[] = [
      { strasse: "Teststr.", hausnummer: 1, suffix: "", punkt: [100, 100] },
    ];
    const { byStrasse, ohneTreffer } = ordneAdressenZu(punkte, [QUADRAT_A, QUADRAT_B], wahlkreisFuer);
    expect(ohneTreffer).toBe(1);
    expect(byStrasse.size).toBe(0);
  });

  it("bevorzugt die unbuchstabierte Zeile bei widersprüchlichen Varianten", () => {
    const punkte: AdressPunkt[] = [
      { strasse: "Teststr.", hausnummer: 5, suffix: "a", punkt: [15, 5] }, // wk2
      { strasse: "Teststr.", hausnummer: 5, suffix: "", punkt: [5, 5] }, // wk1, maßgeblich
    ];
    const { byStrasse } = ordneAdressenZu(punkte, [QUADRAT_A, QUADRAT_B], wahlkreisFuer);
    expect(byStrasse.get("Teststr.")?.get(5)).toBe("wk1");
  });

  it("bevorzugt die unbuchstabierte Zeile unabhängig von der Reihenfolge", () => {
    const punkte: AdressPunkt[] = [
      { strasse: "Teststr.", hausnummer: 5, suffix: "", punkt: [5, 5] }, // wk1, maßgeblich
      { strasse: "Teststr.", hausnummer: 5, suffix: "a", punkt: [15, 5] }, // wk2
    ];
    const { byStrasse } = ordneAdressenZu(punkte, [QUADRAT_A, QUADRAT_B], wahlkreisFuer);
    expect(byStrasse.get("Teststr.")?.get(5)).toBe("wk1");
  });
});
