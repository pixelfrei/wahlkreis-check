import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./stadtteile.js";

describe("wahlkreisFuer", () => {
  it("ordnet die kompletten Stadtbezirke IV/V Wahlkreis 65 zu", () => {
    expect(wahlkreisFuer(16)).toBe("65"); // Schönebeck, Stadtbezirk IV
    expect(wahlkreisFuer(50)).toBe("65"); // Vogelheim, Stadtbezirk V
  });

  it("ordnet die kompletten Stadtbezirke VI/VII sowie die Anlage-Stadtteile aus I Wahlkreis 66 zu", () => {
    expect(wahlkreisFuer(39)).toBe("66"); // Katernberg, Stadtbezirk VI
    expect(wahlkreisFuer(35)).toBe("66"); // Kray, Stadtbezirk VII
    expect(wahlkreisFuer(6)).toBe("66"); // Südostviertel
    expect(wahlkreisFuer(11)).toBe("66"); // Huttrop
    expect(wahlkreisFuer(36)).toBe("66"); // Frillendorf
  });

  it("ordnet den kompletten Stadtbezirk III sowie die Anlage-Stadtteile aus I/II Wahlkreis 67 zu", () => {
    expect(wahlkreisFuer(8)).toBe("67"); // Frohnhausen, Stadtbezirk III
    expect(wahlkreisFuer(1)).toBe("67"); // Stadtkern
    expect(wahlkreisFuer(5)).toBe("67"); // Südviertel
    expect(wahlkreisFuer(10)).toBe("67"); // Rüttenscheid
  });

  it("ordnet die kompletten Stadtbezirke VIII/IX sowie die Anlage-Stadtteile aus II Wahlkreis 68 zu", () => {
    expect(wahlkreisFuer(48)).toBe("68"); // Burgaltendorf, Stadtbezirk VIII
    expect(wahlkreisFuer(49)).toBe("68"); // Kettwig, Stadtbezirk IX
    expect(wahlkreisFuer(12)).toBe("68"); // Rellinghausen
    expect(wahlkreisFuer(13)).toBe("68"); // Bergerhausen
    expect(wahlkreisFuer(14)).toBe("68"); // Stadtwald
  });

  it("wirft bei einer unbekannten Stadtteil-Nummer", () => {
    expect(() => wahlkreisFuer(99)).toThrow();
  });
});
