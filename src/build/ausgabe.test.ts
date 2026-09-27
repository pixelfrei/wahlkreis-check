import { describe, expect, it } from "vitest";
import { ohneBaudatum } from "./aenderungsBericht.js";
import { pruefePlausibilitaet } from "./ausgabe.js";
import type { StrassenDaten } from "../shared/types.js";

function daten(strassen: string[], wahlkreise: Record<string, string> = { "111": "Test I" }): StrassenDaten {
  return {
    meta: { kommune: "Test", stand: "2026-01", gebaut_am: "2026-01-01", quellen: [], zuordnung: "amtlich" },
    wahlkreise,
    strassen: strassen.map((n) => ({ n, wk: "111" })),
  };
}

const HUNDERT = Array.from({ length: 100 }, (_, i) => `Straße ${i}`);

describe("pruefePlausibilitaet", () => {
  it("lässt einen unveränderten Stand ohne Meldung durch", () => {
    const bericht = pruefePlausibilitaet(daten(HUNDERT), daten(HUNDERT));
    expect(bericht).toMatchObject({ neu: [], entfallen: [], geaendert: [], warnungen: [], fehler: [] });
  });

  it("lässt kleine Änderungen durch", () => {
    // eine neue Straße von 100 - der Alltag, keine Meldung
    const bericht = pruefePlausibilitaet(daten(HUNDERT), daten([...HUNDERT, "Neue Straße"]));
    expect(bericht.neu).toEqual(["Neue Straße"]);
    expect(bericht.warnungen).toEqual([]);
    expect(bericht.fehler).toEqual([]);
  });

  it("warnt, wenn ungewöhnlich viele Straßen entfallen", () => {
    const bericht = pruefePlausibilitaet(daten(HUNDERT), daten(HUNDERT.slice(0, 95)));
    expect(bericht.warnungen.join()).toContain("5 Straßen entfallen");
    expect(bericht.fehler).toEqual([]);
  });

  it("bricht ab, wenn ein großer Teil der Straßen fehlt (halb leere Quelldatei)", () => {
    const bericht = pruefePlausibilitaet(daten(HUNDERT), daten(HUNDERT.slice(0, 50)));
    expect(bericht.fehler.join()).toContain("50 Straßen entfallen");
  });

  it("bricht ab, wenn sich die Zuordnung vieler Straßen ändert", () => {
    const alt = daten(HUNDERT);
    const neu = daten(HUNDERT);
    for (let i = 0; i < 10; i++) neu.strassen[i] = { n: HUNDERT[i]!, wk: "112" };
    const bericht = pruefePlausibilitaet(alt, neu);
    expect(bericht.fehler.join()).toContain("10 Straßen geändert");
  });

  it("warnt bei wenigen geänderten Zuordnungen", () => {
    const alt = daten(HUNDERT);
    const neu = daten(HUNDERT);
    neu.strassen[0] = { n: HUNDERT[0]!, wk: "112" };
    expect(pruefePlausibilitaet(alt, neu).warnungen.join()).toContain("1 Straßen geändert");
  });

  it("bricht ab, wenn ein Wahlkreis verschwindet oder neu auftaucht", () => {
    const alt = daten(HUNDERT, { "111": "Test I", "112": "Test II" });
    const ohne = pruefePlausibilitaet(alt, daten(HUNDERT, { "111": "Test I" }));
    expect(ohne.fehler.join()).toContain("nicht mehr vorhanden: 112");

    const mit = pruefePlausibilitaet(daten(HUNDERT, { "111": "Test I" }), alt);
    expect(mit.fehler.join()).toContain("neu aufgetaucht: 112");
  });
});

describe("ohneBaudatum", () => {
  it("blendet das Baudatum aus, damit ein neuer Lauf allein keine Änderung ist", () => {
    const a = daten(HUNDERT);
    const b = { ...daten(HUNDERT), meta: { ...daten(HUNDERT).meta, gebaut_am: "2026-12-31" } };
    expect(ohneBaudatum(a)).toBe(ohneBaudatum(b));
  });

  it("erkennt echte Unterschiede weiterhin", () => {
    expect(ohneBaudatum(daten(HUNDERT))).not.toBe(ohneBaudatum(daten([...HUNDERT, "Neu"])));
  });
});
