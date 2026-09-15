import { baueBenanntesPolygonAusRingen, parseGmlPosList, type BenanntesPolygon } from "./geo.js";
import { BuildError } from "./gruppierung.js";

/**
 * Landesweiter ALKIS-WFS-Dienst "Kataster-Bezirk" (vereinfachtes Schema) -
 * liefert u.a. Gemarkungsgrenzen (Objektart "Gemarkung"). Gemarkungen
 * entsprechen oft historischen, vor Gebietsreformen eigenständigen
 * Gemeinden (z.B. Altenbekens Ortsteile Buke/Schwaney/Altenbeken selbst -
 * jeweils bis 1975 eigenständig) und lassen sich daher nutzen, wenn eine
 * Stadt keinen eigenen Ortsteil-Grenzen-Datensatz veröffentlicht.
 *
 * WICHTIG: outputFormat "application/json"/"json" führt bei diesem Dienst
 * zu einem Server-Fehler ("OGC Proxy: InvalidParameterValue") - nur der
 * GML-Standard-Output (kein outputFormat-Parameter) funktioniert. Die
 * BBOX muss in "minLat,minLon,maxLat,maxLon" (EPSG:4326, Achsreihenfolge
 * lat/lon) angegeben werden, nicht lon/lat.
 */
export const ALKIS_KATASTERBEZIRK_URL = "https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht";

export interface Bbox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

const FEATURE_RE = /<KatasterBezirk[^>]*>([\s\S]*?)<\/KatasterBezirk>/g;

/** Lädt alle Gemarkungen (Objektart "Gemarkung") einer Gemeinde innerhalb
 * der angegebenen Bounding Box. */
export async function ladeGemarkungen(bbox: Bbox, gemeinde: string): Promise<BenanntesPolygon[]> {
  const url =
    `${ALKIS_KATASTERBEZIRK_URL}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ave:KatasterBezirk` +
    `&BBOX=${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon},urn:ogc:def:crs:EPSG::4326`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${url}`);
  }
  const xml = await response.text();

  const ergebnis: BenanntesPolygon[] = [];
  for (const match of xml.matchAll(FEATURE_RE)) {
    const body = match[1]!;
    const art = /<art>([^<]*)<\/art>/.exec(body)?.[1];
    if (art !== "Gemarkung") continue;
    const featureGemeinde = /<gemeinde>([^<]*)<\/gemeinde>/.exec(body)?.[1];
    if (featureGemeinde !== gemeinde) continue;

    const name = /<name>([^<]*)<\/name>/.exec(body)?.[1];
    if (!name) throw new BuildError(`Gemarkung ohne Namen im Feature: ${body.slice(0, 200)}`);

    const ringe = [...body.matchAll(/<gml:posList[^>]*>([^<]*)<\/gml:posList>/g)].map((m) =>
      parseGmlPosList(m[1]!),
    );
    if (ringe.length === 0) throw new BuildError(`Gemarkung "${name}" ohne Geometrie.`);
    ergebnis.push(baueBenanntesPolygonAusRingen(name, ringe));
  }
  return ergebnis;
}
