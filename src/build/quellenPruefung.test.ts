import { describe, expect, it } from "vitest";
import { fasseQuellenZusammen, fingerabdruckAus, kanonischerInhalt } from "./quellenPruefung.js";

describe("fingerabdruckAus", () => {
  it("bevorzugt ETag, dann Änderungsdatum, dann Inhalt, dann Länge", () => {
    const kopf = (werte: Record<string, string>) => new Headers(werte);
    expect(fingerabdruckAus(kopf({ etag: '"abc"', "last-modified": "Mon, 01 Jan 2026 00:00:00 GMT" })))
      .toEqual({ art: "etag", wert: '"abc"' });
    expect(fingerabdruckAus(kopf({ "last-modified": "Mon, 01 Jan 2026 00:00:00 GMT" })))
      .toEqual({ art: "geändert am", wert: "Mon, 01 Jan 2026 00:00:00 GMT" });
    expect(fingerabdruckAus(kopf({ "content-length": "42" }), "hash123"))
      .toEqual({ art: "inhalt", wert: "hash123" });
    expect(fingerabdruckAus(kopf({ "content-length": "42" }))).toEqual({ art: "länge", wert: "42" });
    expect(fingerabdruckAus(kopf({}))).toEqual({ art: "unbekannt", wert: "" });
  });

  it("behandelt schwache ETags wie starke", () => {
    expect(fingerabdruckAus(new Headers({ etag: 'W/"abc"' })).wert).toBe('"abc"');
  });
});

describe("kanonischerInhalt", () => {
  it("ignoriert Zeitstempel und pro Anfrage vergebene Kennungen in GML", () => {
    const gml = (zeit: string, id: string) =>
      `<wfs:FeatureCollection timeStamp="${zeit}"><feature gml:id="${id}"><name>Polsum</name></feature></wfs:FeatureCollection>`;
    expect(kanonischerInhalt(gml("2026-09-22T20:10:33Z", "fid-1"), "text/xml")).toBe(
      kanonischerInhalt(gml("2026-09-23T08:00:00Z", "fid-2"), "text/xml"),
    );
  });

  it("ignoriert Reihenfolge und Kennungen in GeoJSON", () => {
    const merkmal = (id: string, name: string) =>
      `{"type":"Feature","id":"stimmbezirke.fid-${id}","properties":{"st_nr":"${name}"},"geometry":null}`;
    const a = `{"type":"FeatureCollection","features":[${merkmal("aa", "1604")},${merkmal("bb", "1605")}]}`;
    const b = `{"type":"FeatureCollection","features":[${merkmal("cc", "1605")},${merkmal("dd", "1604")}]}`;
    expect(kanonischerInhalt(a, "application/json")).toBe(kanonischerInhalt(b, "application/json"));
  });

  it("erkennt echte Änderungen weiterhin", () => {
    const a = `{"type":"FeatureCollection","features":[{"properties":{"st_nr":"1604"},"geometry":null}]}`;
    const b = `{"type":"FeatureCollection","features":[{"properties":{"st_nr":"9999"},"geometry":null}]}`;
    expect(kanonischerInhalt(a, "application/json")).not.toBe(kanonischerInhalt(b, "application/json"));
  });

  it("entfernt führende Kennungen in CSV-Zeilen und sortiert sie", () => {
    const csv = (id1: string, id2: string, reihenfolge: boolean) => {
      const zeilen = [`ac_adressen.${id1},Aachener Straße,11`, `ac_adressen.${id2},Bahnhofstraße,2`];
      return ["ogc_fid,strasse,hnr", ...(reihenfolge ? zeilen : zeilen.reverse())].join("\n");
    };
    expect(kanonischerInhalt(csv("-1644", "-22", true), "text/csv")).toBe(
      kanonischerInhalt(csv("-6307", "-9", false), "text/csv"),
    );
  });
});

describe("fasseQuellenZusammen", () => {
  it("fragt dieselbe Adresse nur einmal ab und nennt alle Verwender", () => {
    const zusammen = fasseQuellenZusammen([
      { stadt: "Landesweit", name: "GEBREF_URL", url: "https://example.org/gebref.zip" },
      { stadt: "marl", name: "MARL_GEBREF_URL", url: "https://example.org/gebref.zip" },
    ]);
    expect([...zusammen.keys()]).toEqual(["https://example.org/gebref.zip"]);
    expect(zusammen.get("https://example.org/gebref.zip")!.namen).toEqual([
      "Landesweit/GEBREF_URL",
      "marl/MARL_GEBREF_URL",
    ]);
  });

  it("nutzt die Prüf-Adresse, wenn eine hinterlegt ist", () => {
    const zusammen = fasseQuellenZusammen([
      { stadt: "bochum", name: "BOCHUM_ADRESSEN_URL", url: "https://example.org/layer", pruefUrl: "https://example.org/layer?returnCountOnly=true" },
    ]);
    expect([...zusammen.keys()]).toEqual(["https://example.org/layer?returnCountOnly=true"]);
  });
});
