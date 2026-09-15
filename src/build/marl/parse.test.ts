import { describe, expect, it } from "vitest";
import { parseStadtteilePolygone } from "./parse.js";

const GML_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<wfs:FeatureCollection xmlns:Gebietsgliederung="http://example.org/gebietsgliederung" xmlns:gml="http://www.opengis.net/gml" xmlns:wfs="http://www.opengis.net/wfs">
<gml:featureMembers>
<Gebietsgliederung:STADTTEILE_MARL gml:id="STADTTEILE_MARL.1">
<Gebietsgliederung:id>241009</Gebietsgliederung:id>
<Gebietsgliederung:stadtteil>Drewer-Nord</Gebietsgliederung:stadtteil>
<Gebietsgliederung:stadttnr>14</Gebietsgliederung:stadttnr>
<Gebietsgliederung:geoloc>
<gml:Surface><gml:patches><gml:PolygonPatch><gml:exterior><gml:LinearRing>
<gml:posList srsDimension="2">0 0 1 0 1 1 0 1 0 0</gml:posList>
</gml:LinearRing></gml:exterior></gml:PolygonPatch></gml:patches></gml:Surface>
</Gebietsgliederung:geoloc>
</Gebietsgliederung:STADTTEILE_MARL>
<Gebietsgliederung:STADTTEILE_MARL gml:id="STADTTEILE_MARL.2">
<Gebietsgliederung:id>241010</Gebietsgliederung:id>
<Gebietsgliederung:stadtteil>Polsum</Gebietsgliederung:stadtteil>
<Gebietsgliederung:stadttnr>50</Gebietsgliederung:stadttnr>
<Gebietsgliederung:geoloc>
<gml:Surface><gml:patches><gml:PolygonPatch><gml:exterior><gml:LinearRing>
<gml:posList srsDimension="2">10 10 20 10 20 20 10 20 10 10</gml:posList>
</gml:LinearRing></gml:exterior></gml:PolygonPatch></gml:patches></gml:Surface>
</Gebietsgliederung:geoloc>
</Gebietsgliederung:STADTTEILE_MARL>
</gml:featureMembers>
</wfs:FeatureCollection>`;

describe("parseStadtteilePolygone", () => {
  it("parst alle Stadtteil-Features mit Nummer und Ring", () => {
    const polygone = parseStadtteilePolygone(GML_FIXTURE);
    expect(polygone).toHaveLength(2);
    expect(polygone.map((p) => p.name)).toEqual(["14", "50"]);
    expect(polygone[0]!.ringe).toEqual([
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ]);
  });

  it("wirft, wenn keine Features gefunden werden", () => {
    expect(() => parseStadtteilePolygone("<leer/>")).toThrow();
  });
});
