import { describe, expect, it } from "vitest";
import { parseWahlbuch } from "./parse.js";

const FIXTURE = `Der Bürgermeister
Wahlbezirk 3160
Hochdahler Straße 20 - 230 gerade

-- 1 of 3 --

Wahlbezirkseinteilung 2024
Wahlbezirk 3010
Astrid-Lindgren-Schule, Richrather Straße 186
(Wahlberechtigte: 2.381)
Straße 	Haus-Nr.
Am Bruchhauser Kamp 	alle
Richrather Straße 	154 - 998 gerade
Richrather Straße 	229 - 999 ungerade
Kirchhofstraße 	2 - 18c gerade
Schlichterweg 	39

-- 2 of 3 --

Wahlbezirkseinteilung 2024
Wahlbezirk 3020
Seniorenzentrum, Erikaweg 9
(Wahlberechtigte: 2.245)
Straße 	Haus-Nr.
Lortzingstraße 	gerade
Schubertstraße 	ungerade

-- 3 of 3 --

Wahlbezirkseinteilung 2024
Wahlbezirk 	Wahllokal 	Wahlberechtigte
3010 	Astrid-Lindgren-Schule, Richrather Straße 186 	2.381
`;

describe("parseWahlbuch", () => {
  it("ignoriert die einleitende Änderungs-Erläuterung ohne Tabellenkopf", () => {
    const zeilen = parseWahlbuch(FIXTURE);
    expect(zeilen.some((z) => z.strasse === "Hochdahler Straße")).toBe(false);
  });

  it("parst 'alle' als ganze Straße", () => {
    const zeilen = parseWahlbuch(FIXTURE);
    const z = zeilen.find((z) => z.strasse === "Am Bruchhauser Kamp");
    expect(z?.rohZeile).toEqual({ von: null, bis: null, par: null });
  });

  it("parst einen Bereich mit ausgeschriebener Parität", () => {
    const zeilen = parseWahlbuch(FIXTURE);
    const gerade = zeilen.find((z) => z.strasse === "Richrather Straße" && z.rohZeile.par === "g");
    expect(gerade?.rohZeile).toEqual({ von: 154, bis: 998, par: "g" });
  });

  it("belässt die Basisnummer bei Buchstabenzusatz an der oberen Grenze", () => {
    const zeilen = parseWahlbuch(FIXTURE);
    const z = zeilen.find((z) => z.strasse === "Kirchhofstraße");
    expect(z?.rohZeile).toEqual({ von: 2, bis: 18, par: "g", buchstaben: [{ nummer: 18, zusatz: "c" }] });
  });

  it("parst eine einzelne Hausnummer ohne Bereich", () => {
    const zeilen = parseWahlbuch(FIXTURE);
    const z = zeilen.find((z) => z.strasse === "Schlichterweg");
    expect(z?.rohZeile).toEqual({ von: 39, bis: 39, par: "b" });
  });

  it("parst bare 'gerade'/'ungerade' als unbeschränkte Seite", () => {
    const zeilen = parseWahlbuch(FIXTURE);
    expect(zeilen.find((z) => z.strasse === "Lortzingstraße")?.rohZeile).toEqual({
      von: 2,
      bis: 998,
      par: "g",
    });
    expect(zeilen.find((z) => z.strasse === "Schubertstraße")?.rohZeile).toEqual({
      von: 1,
      bis: 999,
      par: "u",
    });
  });

  it("ignoriert die Anlage-2-Übersichtstabelle nach der letzten Straßenliste", () => {
    const zeilen = parseWahlbuch(FIXTURE);
    expect(zeilen.every((z) => z.strasse !== "Wahlbezirk")).toBe(true);
  });

  it("ordnet jede Zeile ihrem korrekten Wahlbezirk zu", () => {
    const zeilen = parseWahlbuch(FIXTURE);
    expect(zeilen.filter((z) => z.wahlbezirk === 3010)).toHaveLength(5);
    expect(zeilen.filter((z) => z.wahlbezirk === 3020)).toHaveLength(2);
  });
});
