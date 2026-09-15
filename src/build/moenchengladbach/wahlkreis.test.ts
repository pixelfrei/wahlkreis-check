import { describe, expect, it } from "vitest";
import { wahlkreisFuer } from "./wahlkreis.js";

describe("wahlkreisFuer", () => {
  it("ordnet die zentrums-/nordnahen Wahlbezirke Wahlkreis 51 zu", () => {
    expect(wahlkreisFuer("10401")).toBe("51"); // Hardt
    expect(wahlkreisFuer("10501")).toBe("51"); // Venn
    expect(wahlkreisFuer("11101")).toBe("51"); // Eicken
  });

  it("ordnet die Uedding/Neuwerk/Bettrath-Wahlbezirke Wahlkreis 51 zu", () => {
    expect(wahlkreisFuer("21601")).toBe("51"); // Uedding
    expect(wahlkreisFuer("21701")).toBe("51"); // Neuwerk
    expect(wahlkreisFuer("21801")).toBe("51"); // Bettrath
  });

  it("ordnet die Rheindahlen-Wahlbezirke Wahlkreis 51 zu", () => {
    expect(wahlkreisFuer("40101")).toBe("51"); // Rheindahlen
    expect(wahlkreisFuer("40301")).toBe("51"); // Hehn
  });

  it("ordnet die Hardterbroich/Pesch/Lürrip-Wahlbezirke Wahlkreis 50 zu", () => {
    expect(wahlkreisFuer("21401")).toBe("50"); // Pesch
    expect(wahlkreisFuer("21501")).toBe("50"); // Lürrip
  });

  it("ordnet die Giesenkirchen-Wahlbezirke Wahlkreis 50 zu", () => {
    expect(wahlkreisFuer("23101")).toBe("50"); // Giesenkirchen
  });

  it("ordnet die Rheydt-Wahlbezirke Wahlkreis 50 zu", () => {
    expect(wahlkreisFuer("32101")).toBe("50"); // Rheydter Bach
    expect(wahlkreisFuer("32601")).toBe("50"); // Rheydt-Mülfort
  });

  it("ordnet die Wickrath-Wahlbezirke Wahlkreis 50 zu", () => {
    expect(wahlkreisFuer("43201")).toBe("50"); // Wickrath
    expect(wahlkreisFuer("43301")).toBe("50"); // Wickrathberg/Wanlo
  });

  it("wirft bei einem unbekannten Wahlbezirk-Präfix", () => {
    expect(() => wahlkreisFuer("99901")).toThrow();
  });
});
