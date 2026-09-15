import { createInterface } from "node:readline";
import * as unzipper from "unzipper";
import { BuildError } from "./gruppierung.js";

/**
 * "Gebäudereferenzen NW" (opengeodata.nrw.de) - ein einziges landesweites
 * ASCII-Verzeichnis (~4,5 Mio. Zeilen, ~97 MB gepackt) mit Straße,
 * Hausnummer, Buchstabenzusatz und Koordinate für jede Adresse in NRW.
 * Trotz des Namens ("Referenzen") enthält jede Zeile die vollständige
 * postalische Adresse, nicht nur eine Gebäude-ID - per Stichprobe
 * verifiziert. Nützlich für Städte ohne eigenen Hauskoordinaten-Datensatz
 * und ohne Vote-Manager-Straßendaten (zuerst für Marl verwendet).
 *
 * Format pro Zeile (";"-getrennt, 21 Felder): Status;OID;Klasse;
 * Land-Schl.;Land-Name;Regbez-Schl.;Regbez-Name;Kreis-Schl.;Kreis-Name;
 * Gemeinde-Schl.;Gemeinde-Name;Ortsteil-Schl.;Ortsteil-Name;Straßenschl.;
 * Straße;Hausnummer;Zusatz;UTM-Zone;Rechtswert;Hochwert;Datum.
 */
export const GEBREF_URL =
  "https://www.opengeodata.nrw.de/produkte/geobasis/lk/akt/gebref_txt/gebref_EPSG25832_ASCII.zip";
const GEBREF_ENTRY = "gebref.txt";

export interface GebrefZeile {
  strasse: string;
  hausnummer: number;
  suffix: string;
  punkt: readonly [number, number];
}

/** Parst eine einzelne Gebref-Zeile - `null`, wenn keine (numerische)
 * Hausnummer vorhanden ist (z.B. Verkehrsflächen ohne Adressierung). */
export function parseGebrefZeile(zeile: string): GebrefZeile | null {
  const spalten = zeile.split(";");
  const hausnummerStr = spalten[15];
  if (!hausnummerStr || !/^\d+$/.test(hausnummerStr)) return null;
  return {
    strasse: spalten[14]!,
    hausnummer: parseInt(hausnummerStr, 10),
    suffix: spalten[16] ?? "",
    punkt: [parseFloat(spalten[18]!), parseFloat(spalten[19]!)],
  };
}

/**
 * Lädt das komplette ZIP in den Speicher (Open.buffer), liest den Eintrag
 * aber zeilenweise gestreamt und filtert sofort auf `gemeindeMarker` (z.B.
 * ";62;Recklinghausen;024;Marl;") - so wird nur die gefilterte Zeilenmenge
 * im Speicher gehalten, nicht die komplette 685-MB-Datei.
 */
export async function ladeGebrefAdressen(gemeindeMarker: string): Promise<GebrefZeile[]> {
  const response = await fetch(GEBREF_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${GEBREF_URL}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const verzeichnis = await unzipper.Open.buffer(buffer);
  const eintrag = verzeichnis.files.find((f) => f.path === GEBREF_ENTRY);
  if (!eintrag) {
    throw new BuildError(`Eintrag "${GEBREF_ENTRY}" nicht im ZIP gefunden.`);
  }

  const ergebnis: GebrefZeile[] = [];
  const zeilen = createInterface({ input: eintrag.stream() });
  for await (const zeile of zeilen) {
    if (!zeile.includes(gemeindeMarker)) continue;
    const geparst = parseGebrefZeile(zeile);
    if (geparst) ergebnis.push(geparst);
  }
  return ergebnis;
}
