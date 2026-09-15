import { buchstabenGrenzen } from "../buchstabenPruefung.js";
import { BuildError } from "../gruppierung.js";
import type { Paritaet } from "../../shared/types.js";

const FOLGE_ZU_PARITAET: Record<string, Paritaet> = {
  fortlaufend: "b",
  gerade: "g",
  ungerade: "u",
};

const ROW_START_RE = /^((fortlaufend|gerade|ungerade)\t)?\d{5}\s/;

/**
 * pdf-parse gibt die Tabelle spaltenverschoben aus: die "bis"-Spalte landet
 * an einer anderen Stelle als bei einer normalen Layout-Extraktion, getrennt
 * durch ein Tab-Zeichen. Bei Bereichszeilen sieht eine Rohzeile so aus:
 * "<folge>\t<Straßenschlüssel> <Straßenname> <von> - <Stimmbezirk> <Bezirksvertretung>\t<bis>".
 * Bei einer einzelnen Hausnummer (kein Bereich) fehlt Folge und Tab:
 * "<Straßenschlüssel> <Straßenname> <Nummer> <Stimmbezirk> <Bezirksvertretung>".
 * Ohne echte Hausnummer: "<Straßenschlüssel> <Straßenname> Keine echte
 * Hausnummer vorhanden".
 */
const BEREICH_RE =
  /^(fortlaufend|gerade|ungerade)\t(\d+)\s+(.+?)\s+(\d+)([a-zA-Z]?)\s*-\s*(\d+)\s+(\S+)\t(\d+)([a-zA-Z]?)$/;
const EINZELN_RE = /^(\d+)\s+(.+?)\s+(\d+)([a-zA-Z]?)\s+(\d+)\s+(\S+)$/;
const OHNE_HAUSNUMMER_RE = /^(\d+)\s+(.+?)\s+Keine echte Hausnummer vorhanden$/;

export interface MuensterZeile {
  strasse: string;
  von: number | null;
  bis: number | null;
  par: Paritaet | null;
  stimmbezirk: number;
  /** Grenzen mit Buchstabenzusatz (nur für die Buchstaben-Prüfung, die Zuordnung ignoriert sie). */
  buchstaben?: { nummer: number; zusatz: string }[];
}

function isSkipLine(line: string): boolean {
  if (/^Seite \d+ von \d+$/.test(line)) return true;
  if (/^-- \d+ of \d+ --$/.test(line)) return true;
  if (line.startsWith("Stadt Münster")) return true;
  if (line.startsWith("Straßenverzeichnis mit")) return true;
  if (line.startsWith("Stand: ")) return true;
  if (line === "Straßen-") return true;
  if (line.startsWith("schlüssel ")) return true;
  if (line === "Stimm-") return true;
  if (line === "bezirk") return true;
  if (line === "folge\t- bis\tvon" || line === "folge\tvon\t- bis") return true;
  if (line === "Bezirks-") return true;
  if (line === "vertretung") return true;
  if (/^[A-ZÄÖÜ]$/.test(line)) return true;
  return false;
}

/**
 * Manche Straßennamen sind so lang, dass sie im PDF über mehrere Zeilen
 * umbrechen - pdf-parse gibt jede davon als eigene Zeile aus. Eine Zeile
 * startet eine neue Tabellenzeile, wenn sie mit einer fünfstelligen
 * Straßenschlüssel-Nummer beginnt (optional mit vorangestelltem Folge-Wort);
 * jede andere Zeile ist Fortsetzung des Straßennamens der vorherigen Zeile.
 */
function mergeZeilen(lines: string[]): string[] {
  const merged: string[] = [];
  let current: string | null = null;

  for (const line of lines) {
    if (ROW_START_RE.test(line)) {
      if (current !== null) merged.push(current);
      current = line;
    } else if (current !== null) {
      current = current.endsWith("-") ? current + line : `${current} ${line}`;
    }
  }
  if (current !== null) merged.push(current);

  return merged;
}

function parseZeile(row: string): MuensterZeile {
  const bereich = BEREICH_RE.exec(row);
  if (bereich) {
    const [, folge, , strasse, von, vonZusatz, stimmbezirk, , bis, bisZusatz] = bereich;
    const buchstaben = buchstabenGrenzen(
      { nummer: parseInt(von!, 10), zusatz: vonZusatz },
      { nummer: parseInt(bis!, 10), zusatz: bisZusatz },
    );
    return {
      ...(buchstaben && { buchstaben }),
      strasse: strasse!,
      von: parseInt(von!, 10),
      bis: parseInt(bis!, 10),
      par: FOLGE_ZU_PARITAET[folge!]!,
      stimmbezirk: parseInt(stimmbezirk!, 10),
    };
  }

  const einzeln = EINZELN_RE.exec(row);
  if (einzeln) {
    const [, , strasse, nummer, zusatz, stimmbezirk] = einzeln;
    const n = parseInt(nummer!, 10);
    const buchstaben = buchstabenGrenzen({ nummer: n, zusatz }, null);
    return {
      ...(buchstaben && { buchstaben }),
      strasse: strasse!,
      von: n,
      bis: n,
      par: "b",
      stimmbezirk: parseInt(stimmbezirk!, 10),
    };
  }

  const ohneHausnummer = OHNE_HAUSNUMMER_RE.exec(row);
  if (ohneHausnummer) {
    // Straßenschlüssel/Stimmbezirk/Bezirksvertretung fehlen hier komplett -
    // ohne Hausnummer lässt sich diese Zeile keinem Stimmbezirk zuordnen und
    // ist für die Adresssuche ohnehin irrelevant.
    return { strasse: ohneHausnummer[2]!, von: null, bis: null, par: null, stimmbezirk: -1 };
  }

  throw new BuildError(`Unbekannte Zeile im Straßenverzeichnis: "${row}"`);
}

export function parseRohtext(text: string): MuensterZeile[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isSkipLine(l));

  return mergeZeilen(lines)
    .map(parseZeile)
    .filter((z) => z.stimmbezirk !== -1);
}
