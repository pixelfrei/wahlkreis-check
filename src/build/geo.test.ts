import { describe, expect, it } from "vitest";
import {
  baueBenanntesPolygon,
  baueBenanntesPolygonAusRingen,
  findePolygon,
  parseGmlPosList,
  parseWktPoint,
  parseWktPolygon,
  ringAusGeoJsonPolygon,
  ringeAusGeoJsonMultiPolygon,
} from "./geo.js";

const QUADRAT = "POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))";

describe("parseWktPolygon", () => {
  it("parst einen einfachen Ring", () => {
    expect(parseWktPolygon(QUADRAT)).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ]);
  });
});

describe("parseWktPoint", () => {
  it("parst einen Punkt", () => {
    expect(parseWktPoint("POINT (5.5 3.25)")).toEqual([5.5, 3.25]);
  });
});

describe("findePolygon", () => {
  const quadrat = baueBenanntesPolygon("q", QUADRAT);
  const nachbar = baueBenanntesPolygon("n", "POLYGON ((10 0, 20 0, 20 10, 10 10, 10 0))");

  it("findet das Polygon, das einen Punkt enthält", () => {
    expect(findePolygon([5, 5], [quadrat, nachbar])).toEqual(["q"]);
    expect(findePolygon([15, 5], [quadrat, nachbar])).toEqual(["n"]);
  });

  it("findet kein Polygon für einen Punkt außerhalb", () => {
    expect(findePolygon([100, 100], [quadrat, nachbar])).toEqual([]);
  });

  it("findet ein Polygon mit zwei getrennten Teilen (MultiPolygon)", () => {
    const ringe = ringeAusGeoJsonMultiPolygon([
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
      [
        [
          [50, 50],
          [51, 50],
          [51, 51],
          [50, 51],
          [50, 50],
        ],
      ],
    ]);
    const zerteilt = baueBenanntesPolygonAusRingen("z", ringe);
    expect(findePolygon([0.5, 0.5], [zerteilt])).toEqual(["z"]);
    expect(findePolygon([50.5, 50.5], [zerteilt])).toEqual(["z"]);
    expect(findePolygon([25, 25], [zerteilt])).toEqual([]);
  });
});

describe("ringAusGeoJsonPolygon", () => {
  it("extrahiert den äußeren Ring aus GeoJSON-Polygon-Koordinaten", () => {
    expect(
      ringAusGeoJsonPolygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ]),
    ).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ]);
  });
});

describe("parseGmlPosList", () => {
  it("parst eine flache Koordinatenliste in Punktpaare", () => {
    expect(parseGmlPosList("0 0 10 0 10 10 0 10 0 0")).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ]);
  });
});
