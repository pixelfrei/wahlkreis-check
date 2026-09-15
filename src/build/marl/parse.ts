import { baueBenanntesPolygonAusRingen, parseGmlPosList, type BenanntesPolygon } from "../geo.js";
import { BuildError } from "../gruppierung.js";

const FEATURE_RE =
  /<Gebietsgliederung:STADTTEILE_MARL[^>]*>[\s\S]*?<Gebietsgliederung:stadttnr>([^<]*)<\/Gebietsgliederung:stadttnr>[\s\S]*?<gml:posList[^>]*>([^<]*)<\/gml:posList>[\s\S]*?<\/Gebietsgliederung:STADTTEILE_MARL>/g;

/**
 * Parst die GML-Antwort des Kreis-Recklinghausen-WFS in benannte Polygone,
 * benannt nach der Stadtteil-Nummer ("stadttnr"). Regex statt eines
 * vollwertigen XML-Parsers, weil die Struktur immer gleich flach ist (kein
 * Nesting über die hier interessierenden Felder hinaus) - siehe
 * config.ts für die Quelle.
 */
export function parseStadtteilePolygone(gml: string): BenanntesPolygon[] {
  const ergebnis: BenanntesPolygon[] = [];
  for (const match of gml.matchAll(FEATURE_RE)) {
    const stadttnr = match[1]!.trim();
    const ring = parseGmlPosList(match[2]!);
    ergebnis.push(baueBenanntesPolygonAusRingen(stadttnr, [ring]));
  }
  if (ergebnis.length === 0) {
    throw new BuildError("Keine STADTTEILE_MARL-Features im GML gefunden.");
  }
  return ergebnis;
}
