import { buchstabenGrenzen } from "../buchstabenPruefung.js";
import { BuildError, type RohZeile } from "../gruppierung.js";

export interface HildenZeile {
  wahlbezirk: number;
  strasse: string;
  rohZeile: Omit<RohZeile, "wk">;
}

const ABSCHNITT_START_RE = /^Wahlbezirk (\d{4})$/;
const HEADER_RE = /^Straße\s*Haus-Nr\.?$/;
const DATENZEILE_RE = /^(.+?)\t(.+)$/;
const SEITENUMBRUCH_RE = /^-- \d+ of \d+ --$/;

/**
 * Segment-Grammatik der Hildener Wahlbezirks-PDF: "alle" (ganze Straße),
 * eine einzelne Hausnummer ("39"), oder ein Bereich ("2 - 18c gerade") -
 * anders als bei den meisten anderen Städten ausgeschrieben
 * ("gerade"/"ungerade"/"alle" statt "ger."/"ung."), das Trennzeichen "-"
 * mit uneinheitlichen Leerzeichen ("1 -66 alle", "121- 227 ungerade"). Ein
 * Buchstabenzusatz an der oberen Bereichsgrenze kommt vor ("2 - 18c
 * gerade") - an der UNTEREN Grenze wurde in der gesamten Datei kein
 * einziger Fall gefunden, die sonst übliche +1-Verschiebung ist hier also
 * nie nötig.
 */
const BEREICH_RE = /^(\d+)([a-zA-Z]?)\s*-\s*(\d+)([a-zA-Z]?)\s*(gerade|ungerade|alle)?$/;
const EINZELN_RE = /^(\d+)([a-zA-Z]?)$/;

/**
 * Bare "gerade"/"ungerade" (ohne Hausnummern) bedeutet "die ganze
 * gerade/ungerade Straßenseite, keine Beschränkung" - das Dokument selbst
 * nutzt an anderer Stelle durchgängig 998/999 als Sentinel für "keine
 * echte Obergrenze" (z.B. "24 - 998 gerade", "231 - 999 ungerade"),
 * übernommen für den unbeschränkten Fall.
 */
function parseBereich(bereich: string): Omit<RohZeile, "wk"> {
  const text = bereich.trim();
  if (text === "alle") return { von: null, bis: null, par: null };
  if (text === "gerade") return { von: 2, bis: 998, par: "g" };
  if (text === "ungerade") return { von: 1, bis: 999, par: "u" };

  const bereichMatch = BEREICH_RE.exec(text);
  if (bereichMatch) {
    const [, vonStr, vonZusatz, bisStr, bisZusatz, qualifier] = bereichMatch;
    const von = vonZusatz ? parseInt(vonStr!, 10) + 1 : parseInt(vonStr!, 10);
    const bis = parseInt(bisStr!, 10);
    const par = qualifier === "gerade" ? "g" : qualifier === "ungerade" ? "u" : "b";
    const buchstaben = buchstabenGrenzen(
      { nummer: parseInt(vonStr!, 10), zusatz: vonZusatz },
      { nummer: bis, zusatz: bisZusatz },
    );
    return { von, bis, par, ...(buchstaben && { buchstaben }) };
  }

  const einzelnMatch = EINZELN_RE.exec(text);
  if (einzelnMatch) {
    const basis = parseInt(einzelnMatch[1]!, 10);
    const buchstaben = buchstabenGrenzen({ nummer: basis, zusatz: einzelnMatch[2] }, null);
    return { von: basis, bis: basis, par: "b", ...(buchstaben && { buchstaben }) };
  }

  throw new BuildError(`Unbekanntes Hausnummern-Segment: "${bereich}"`);
}

/**
 * Parst die amtliche Beschlussvorlage "Einteilung des Hildener
 * Stadtgebietes in Wahlbezirke" (Anlage 1: Wahlbezirke mit zugeordneten
 * Straßen). Verarbeitet nur die 20 echten Wahlbezirk-Abschnitte (jeweils
 * eingeleitet durch "Wahlbezirkseinteilung 2024" + "Wahlbezirk NNNN" +
 * die Tabellenüberschrift "Straße Haus-Nr.") - ignoriert sowohl die
 * einleitenden Änderungs-Erläuterungen (erwähnen einzelne Wahlbezirk-
 * Nummern ohne die Tabellenüberschrift) als auch die nachfolgende
 * Anlage 2 (Wahlberechtigte-Übersicht, andere Spaltenstruktur).
 */
export function parseWahlbuch(text: string): HildenZeile[] {
  const zeilen = text
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter((z) => z.length > 0 && !SEITENUMBRUCH_RE.test(z));

  const ergebnis: HildenZeile[] = [];
  let aktuellerWahlbezirk: number | null = null;
  let inTabelle = false;

  for (let i = 0; i < zeilen.length; i++) {
    const zeile = zeilen[i]!;

    const abschnittMatch = ABSCHNITT_START_RE.exec(zeile);
    if (abschnittMatch && zeilen[i - 1] === "Wahlbezirkseinteilung 2024") {
      aktuellerWahlbezirk = parseInt(abschnittMatch[1]!, 10);
      inTabelle = false;
      continue;
    }

    if (aktuellerWahlbezirk === null) continue;

    if (HEADER_RE.test(zeile.replace(/\s+/g, " "))) {
      inTabelle = true;
      continue;
    }

    if (!inTabelle) continue;

    // Eine neue "Wahlbezirkseinteilung 2024"-Zeile beendet die aktuelle
    // Tabelle (nächster Abschnitt oder die Anlage-2-Übersicht).
    if (zeile === "Wahlbezirkseinteilung 2024") {
      inTabelle = false;
      continue;
    }

    // Einzelner Dateipfad-Fußzeilenartefakt am Seitenumbruch zwischen
    // Anlage 1 und Anlage 2 (kein "-- N of 33 --"-Marker davor/danach) -
    // eindeutig kein Datenzeile, gezielt übersprungen statt generisch jede
    // nicht passende Zeile zu ignorieren.
    if (zeile.endsWith(".docx")) continue;

    const datenMatch = DATENZEILE_RE.exec(zeile);
    if (!datenMatch) {
      throw new BuildError(
        `Unerwartete Zeile in Wahlbezirk ${aktuellerWahlbezirk}: "${zeile}"`,
      );
    }
    const [, strasse, bereich] = datenMatch;
    ergebnis.push({
      wahlbezirk: aktuellerWahlbezirk,
      strasse: strasse!.trim(),
      rohZeile: parseBereich(bereich!),
    });
  }

  if (ergebnis.length === 0) {
    throw new BuildError("Keine Wahlbezirk-Straßenzeilen im Dokument gefunden.");
  }
  return ergebnis;
}
