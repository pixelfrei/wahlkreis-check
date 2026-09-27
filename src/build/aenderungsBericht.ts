import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pruefePlausibilitaet } from "./ausgabe.js";
import type { StrassenDaten } from "../shared/types.js";

/**
 * Fasst zusammen, was sich in public/data/ gegenüber dem letzten Commit
 * geändert hat - als Text für den Änderungsvorschlag bei GitHub und für den
 * Blick zwischendurch:
 *
 *   npm run bericht:daten
 *
 * Reine Datums-Änderungen (meta.gebaut_am) zählen nicht als Änderung: Die
 * Aufbereitung setzt das Datum bei jedem Lauf neu, auch wenn die Quelle
 * unverändert ist.
 */
export function ohneBaudatum(daten: StrassenDaten): string {
  return JSON.stringify({ ...daten, meta: { ...daten.meta, gebaut_am: "" } });
}

function ausGit(pfad: string): StrassenDaten | null {
  try {
    return JSON.parse(execFileSync("git", ["show", `HEAD:${pfad}`], { maxBuffer: 1e9 }).toString()) as StrassenDaten;
  } catch {
    return null;
  }
}

export interface StadtAenderung {
  pfad: string;
  kommune: string;
  text: string;
  nurDatum: boolean;
}

export function vergleicheStadt(pfad: string): StadtAenderung | null {
  const neu = JSON.parse(readFileSync(pfad, "utf-8")) as StrassenDaten;
  const alt = ausGit(pfad);
  if (!alt) return { pfad, kommune: neu.meta.kommune, text: "neu hinzugekommen", nurDatum: false };
  if (ohneBaudatum(alt) === ohneBaudatum(neu)) {
    return { pfad, kommune: neu.meta.kommune, text: "nur Baudatum", nurDatum: true };
  }

  const bericht = pruefePlausibilitaet(alt, neu);
  const teile: string[] = [];
  const liste = (namen: string[]) =>
    namen.slice(0, 10).join(", ") + (namen.length > 10 ? ` … (+${namen.length - 10})` : "");
  if (bericht.neu.length > 0) teile.push(`**${bericht.neu.length} neu**: ${liste(bericht.neu)}`);
  if (bericht.entfallen.length > 0) {
    teile.push(`**${bericht.entfallen.length} entfallen**: ${liste(bericht.entfallen)}`);
  }
  if (bericht.geaendert.length > 0) {
    teile.push(`**${bericht.geaendert.length} geändert**: ${liste(bericht.geaendert)}`);
  }
  if (alt.meta.stand !== neu.meta.stand) teile.push(`Datenstand ${alt.meta.stand} → ${neu.meta.stand}`);
  for (const w of bericht.warnungen) teile.push(`⚠️ ${w}`);

  return {
    pfad,
    kommune: neu.meta.kommune,
    text: teile.join("; ") || "unverändert",
    nurDatum: false,
  };
}

/** Geänderte Datendateien laut git. */
export function geaenderteDateien(): string[] {
  const ausgabe = execFileSync("git", ["status", "--porcelain", "public/data"]).toString();
  return ausgabe
    .split("\n")
    .filter((z) => z.trim().length > 0)
    .map((z) => z.slice(3).trim())
    .filter((p) => p.endsWith(".json"));
}

export function bericht(): { markdown: string; echteAenderungen: StadtAenderung[]; nurDatum: string[] } {
  const aenderungen = geaenderteDateien().map(vergleicheStadt).filter((a): a is StadtAenderung => a !== null);
  const echte = aenderungen.filter((a) => !a.nurDatum);
  const nurDatum = aenderungen.filter((a) => a.nurDatum).map((a) => a.pfad);

  const zeilen =
    echte.length === 0
      ? ["Keine inhaltlichen Änderungen."]
      : ["| Stadt | Änderung |", "| --- | --- |", ...echte.map((a) => `| ${a.kommune} | ${a.text} |`)];

  return { markdown: zeilen.join("\n"), echteAenderungen: echte, nurDatum };
}

/** Dateien zurücksetzen, die sich nur im Baudatum unterscheiden. */
export function setzeNurDatumZurueck(pfade: string[]): void {
  for (const pfad of pfade) execFileSync("git", ["checkout", "--", pfad]);
}

if (process.argv[1]?.endsWith("aenderungsBericht.ts")) {
  const ergebnis = bericht();
  // Bericht nach stdout (für die Beschreibung des Änderungsvorschlags),
  // Hinweise nach stderr.
  console.log(ergebnis.markdown);
  if (process.argv.includes("--zuruecksetzen") && ergebnis.nurDatum.length > 0) {
    setzeNurDatumZurueck(ergebnis.nurDatum);
    console.error(`${ergebnis.nurDatum.length} Datei(en) ohne inhaltliche Änderung zurückgesetzt`);
  } else if (ergebnis.nurDatum.length > 0) {
    console.error(`(${ergebnis.nurDatum.length} Datei(en) nur mit neuem Baudatum)`);
  }
}
