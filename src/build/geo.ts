export type Punkt = readonly [number, number];

/**
 * Minimale WKT-Unterstützung für die Fälle, die für Punkt-in-Polygon-Abgleiche
 * gebraucht werden: ein einzelner Ring ohne Löcher ("POLYGON ((...))") sowie
 * einzelne Punkte ("POINT (...)"). Reicht für die bisher gefundenen
 * amtlichen Geodatendienste (Bielefeld, Aachen) - beide liefern einfache
 * Polygone ohne Multi-Ring-Struktur.
 */
export function parseWktPolygon(wkt: string): Punkt[] {
  const match = /POLYGON\s*\(\(([^)]+)\)\)/i.exec(wkt);
  if (!match) throw new Error(`Kein einfaches POLYGON in WKT erkannt: "${wkt.slice(0, 50)}..."`);
  return match[1]!
    .split(",")
    .map((paar) => paar.trim().split(/\s+/).map(Number) as [number, number]);
}

export function parseWktPoint(wkt: string): Punkt {
  const match = /POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i.exec(wkt);
  if (!match) throw new Error(`Kein POINT in WKT erkannt: "${wkt}"`);
  return [Number(match[1]), Number(match[2])];
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boundingBox(polygon: Punkt[]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

function inBoundingBox([x, y]: Punkt, box: BoundingBox): boolean {
  return x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY;
}

/** Ray-Casting (even-odd rule). Erwartet einen einzelnen Ring ohne Löcher. */
export function pointInPolygon([px, py]: Punkt, polygon: Punkt[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    const schneidet = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (schneidet) inside = !inside;
  }
  return inside;
}

/**
 * Ein benanntes Gebiet kann aus mehreren getrennten Ringen bestehen
 * (MultiPolygon, z.B. wenn ein Stimmbezirk in zwei nicht zusammenhängenden
 * Teilen existiert) - Löcher innerhalb eines Rings werden nicht unterstützt
 * (bei den bisher gefundenen Diensten nicht gebraucht).
 */
export interface BenanntesPolygon {
  name: string;
  ringe: Punkt[][];
  box: BoundingBox;
}

export function baueBenanntesPolygonAusRingen(name: string, ringe: Punkt[][]): BenanntesPolygon {
  return { name, ringe, box: boundingBox(ringe.flat()) };
}

export function baueBenanntesPolygon(name: string, wkt: string): BenanntesPolygon {
  return baueBenanntesPolygonAusRingen(name, [parseWktPolygon(wkt)]);
}

/**
 * Extrahiert aus GeoJSON-MultiPolygon-Koordinaten (Array von Polygonen, jedes
 * Polygon ein Array von Ringen) nur die jeweils äußeren Ringe (Index 0) -
 * Löcher (weitere Ringe) werden ignoriert, siehe BenanntesPolygon.
 */
export function ringeAusGeoJsonMultiPolygon(coordinates: number[][][][]): Punkt[][] {
  return coordinates.map((polygon) => polygon[0]!.map(([x, y]) => [x, y] as Punkt));
}

/** Extrahiert aus GeoJSON-Polygon-Koordinaten (Array von Ringen) nur den
 * äußeren Ring (Index 0) - Löcher werden ignoriert, siehe BenanntesPolygon. */
export function ringAusGeoJsonPolygon(coordinates: number[][][]): Punkt[] {
  return coordinates[0]!.map(([x, y]) => [x, y] as Punkt);
}

/**
 * Parst eine GML "posList" (flache, leerzeichengetrennte Koordinatenliste
 * "x1 y1 x2 y2 ...", wie sie viele GeoServer-WFS-Diensten liefern, wenn
 * GeoJSON nicht unterstützt wird) in einen Ring.
 */
export function parseGmlPosList(posList: string): Punkt[] {
  const werte = posList.trim().split(/\s+/).map(Number);
  const ring: Punkt[] = [];
  for (let i = 0; i < werte.length; i += 2) {
    ring.push([werte[i]!, werte[i + 1]!]);
  }
  return ring;
}

/**
 * Findet das (einzige erwartete) Polygon, das den Punkt enthält. Nutzt die
 * Bounding Box als schnellen Vorfilter, bevor der teure Ray-Casting-Test
 * läuft - bei tausenden Punkten gegen wenige, aber knotenreiche Polygone
 * spart das die meiste Rechenzeit.
 */
export function findePolygon(punkt: Punkt, polygone: BenanntesPolygon[]): string[] {
  const treffer: string[] = [];
  for (const p of polygone) {
    if (!inBoundingBox(punkt, p.box)) continue;
    if (p.ringe.some((ring) => pointInPolygon(punkt, ring))) treffer.push(p.name);
  }
  return treffer;
}
