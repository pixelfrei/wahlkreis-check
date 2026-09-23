import { readdir } from "node:fs/promises";
import { ALKIS_KATASTERBEZIRK_URL } from "./alkisGemarkung.js";
import { STRASSENVERZEICHNIS_DATASET, WAHLRAUM_DATASET } from "./config.js";
import { GEBREF_URL } from "./gebref.js";

export interface Quelle {
  /** Stadt bzw. "Landesweit" für Quellen, die mehrere Städte versorgen. */
  stadt: string;
  /** Name der Konstante in der Konfiguration, z.B. ESSEN_STRASSEN_URL. */
  name: string;
  url: string;
  /**
   * Adresse, die für die Änderungsprüfung abgefragt wird. Nötig bei Diensten,
   * deren Basis-Adresse ohne Parameter nur eine Info-Seite liefert - deren
   * Fingerabdruck würde sich nie ändern, auch wenn sich die Daten ändern.
   */
  pruefUrl?: string;
}

/** Datensatz-Metadaten des Dortmunder Open-Data-Portals (enthalten das Änderungsdatum). */
const DORTMUND_METADATEN = "https://open-data.dortmund.de/api/explore/v2.1/catalog/datasets/";

/**
 * Prüf-Adressen für Dienste, die erst mit Parametern echte Daten liefern:
 * - Bochum: Anzahl der Adressen im Wahl-Layer (ändert sich mit den Daten)
 * - ALKIS: dieselbe Abfrage wie beim Bauen von Altenbeken, klein und schnell
 */
const PRUEF_ADRESSEN: Record<string, string> = {
  BOCHUM_ADRESSEN_URL:
    "https://geoservicekkm.bochum.de/arcgis/rest/services/maponline/Wahlen/MapServer/16/query?where=1%3D1&returnCountOnly=true&f=json",
  ALKIS_KATASTERBEZIRK_URL:
    `${ALKIS_KATASTERBEZIRK_URL}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ave:KatasterBezirk` +
    "&BBOX=51.72,8.85,51.82,9.02,urn:ogc:def:crs:EPSG::4326",
};

/** Quellen, die nicht in einer Stadt-Konfiguration stehen. */
const WEITERE_QUELLEN: Quelle[] = [
  {
    stadt: "Landesweit",
    name: "LANDESWAHLGESETZ_ANLAGE",
    url: "https://recht.nrw.de/system/files/2026-02/gv2026-4-5anlage1.pdf",
  },
  { stadt: "Landesweit", name: "GEBREF_URL", url: GEBREF_URL },
  { stadt: "Landesweit", name: "ALKIS_KATASTERBEZIRK_URL", url: ALKIS_KATASTERBEZIRK_URL },
  {
    stadt: "Dortmund",
    name: "STRASSENVERZEICHNIS_DATASET",
    url: `${DORTMUND_METADATEN}${STRASSENVERZEICHNIS_DATASET}`,
  },
  {
    stadt: "Dortmund",
    name: "WAHLRAUM_DATASET",
    url: `${DORTMUND_METADATEN}${WAHLRAUM_DATASET}`,
  },
];

/**
 * Sammelt alle Quell-Adressen ein: jede Stadt-Konfiguration exportiert ihre
 * URLs als Konstanten (z.B. ESSEN_STRASSEN_URL). So bleibt die Liste
 * automatisch vollständig, auch wenn eine Stadt dazukommt.
 */
export async function sammleQuellen(verzeichnis = "src/build"): Promise<Quelle[]> {
  const eintraege = await readdir(verzeichnis, { withFileTypes: true });
  const quellen: Quelle[] = [...WEITERE_QUELLEN];

  for (const quelle of quellen) {
    const ersatz = PRUEF_ADRESSEN[quelle.name];
    if (ersatz) quelle.pruefUrl = ersatz;
  }

  for (const eintrag of eintraege.filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    let modul: Record<string, unknown>;
    try {
      modul = (await import(`./${eintrag.name}/config.js`)) as Record<string, unknown>;
    } catch {
      continue; // Ordner ohne config.ts
    }
    for (const [name, wert] of Object.entries(modul)) {
      if (typeof wert === "string" && wert.startsWith("http")) {
        const pruefUrl = PRUEF_ADRESSEN[name];
        quellen.push({ stadt: eintrag.name, name, url: wert, ...(pruefUrl && { pruefUrl }) });
      }
    }
  }

  return quellen.sort((a, b) => a.stadt.localeCompare(b.stadt) || a.name.localeCompare(b.name));
}
