import { describe, expect, it, vi, afterEach } from "vitest";
import { ladeGemarkungen } from "./alkisGemarkung.js";

const XML_FIXTURE = `<?xml version="1.0"?>
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0">
<wfs:member>
<KatasterBezirk gml:id="DE1">
<oid>DE1</oid>
<art>Gemarkung</art>
<name>Buke</name>
<gemeinde>Altenbeken</gemeinde>
<geometrie>
<gml:MultiSurface><gml:surfaceMember><gml:Polygon><gml:exterior><gml:LinearRing>
<gml:posList>0 0 1 0 1 1 0 1 0 0</gml:posList>
</gml:LinearRing></gml:exterior></gml:Polygon></gml:surfaceMember></gml:MultiSurface>
</geometrie>
</KatasterBezirk>
</wfs:member>
<wfs:member>
<KatasterBezirk gml:id="DE2">
<oid>DE2</oid>
<art>Gemarkungsteil/Flur</art>
<name>001</name>
<gemeinde>Altenbeken</gemeinde>
<geometrie>
<gml:MultiSurface><gml:surfaceMember><gml:Polygon><gml:exterior><gml:LinearRing>
<gml:posList>5 5 6 5 6 6 5 6 5 5</gml:posList>
</gml:LinearRing></gml:exterior></gml:Polygon></gml:surfaceMember></gml:MultiSurface>
</geometrie>
</KatasterBezirk>
</wfs:member>
<wfs:member>
<KatasterBezirk gml:id="DE3">
<oid>DE3</oid>
<art>Gemarkung</art>
<name>Nachbargemeinde</name>
<gemeinde>Nebenan</gemeinde>
<geometrie>
<gml:MultiSurface><gml:surfaceMember><gml:Polygon><gml:exterior><gml:LinearRing>
<gml:posList>10 10 11 10 11 11 10 11 10 10</gml:posList>
</gml:LinearRing></gml:exterior></gml:Polygon></gml:surfaceMember></gml:MultiSurface>
</geometrie>
</KatasterBezirk>
</wfs:member>
</wfs:FeatureCollection>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ladeGemarkungen", () => {
  it("filtert auf Objektart 'Gemarkung' und die angegebene Gemeinde", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(XML_FIXTURE) }),
    );

    const gemarkungen = await ladeGemarkungen(
      { minLat: 51.72, minLon: 8.85, maxLat: 51.82, maxLon: 9.02 },
      "Altenbeken",
    );

    expect(gemarkungen.map((g) => g.name)).toEqual(["Buke"]);
    expect(gemarkungen[0]!.ringe).toEqual([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]);
  });
});
