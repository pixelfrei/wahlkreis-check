import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { berichteBuchstaben, type BuchstabenAdresse } from "../buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { DUISBURG_QUELLE_STAND, DUISBURG_QUELLE_URL, DUISBURG_WAHLKREISE } from "./config.js";
import {
  benenneMehrdeutigeNamen,
  komprimiereZuBereichen,
  type DuisburgZeile,
  type PhysischeStrasse,
} from "./parse.js";

const OUTPUT_PATH = "public/data/duisburg.json";

async function ladeZeilen(): Promise<DuisburgZeile[]> {
  const response = await fetch(DUISBURG_QUELLE_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${DUISBURG_QUELLE_URL}`);
  }
  // Die Quelle liefert ISO-8859-1 (Latin-1), nicht UTF-8.
  const buffer = await response.arrayBuffer();
  const text = new TextDecoder("iso-8859-1").decode(buffer);

  const zeilen = text.split(/\r?\n/).filter((z) => z.length > 0);
  const [header, ...datenzeilen] = zeilen;
  const spaltenNamen = header!.split(";");
  const idx = (name: string) => {
    const i = spaltenNamen.indexOf(name);
    if (i === -1) throw new BuildError(`Spalte "${name}" nicht gefunden in: ${header}`);
    return i;
  };

  const iStrschl = idx("STRSCHL");
  const iName = idx("STRAßENNAME");
  const iHnr = idx("HAUSNUMMER");
  const iStatus = idx("STATUSTXT");
  const iStadtbezirk = idx("STADTBEZIRKTXT");
  const iLwk = idx("LANDTAGSWAHLKREIS");
  const iZusatz = idx("ZUSATZ");

  const ergebnis: DuisburgZeile[] = [];
  for (const zeile of datenzeilen) {
    const spalten = zeile.split(";");
    if (spalten[iStatus]?.replace(/"/g, "") !== "aktuell") continue;

    const hausnummer = parseInt(spalten[iHnr] ?? "", 10);
    if (Number.isNaN(hausnummer)) {
      throw new BuildError(`Ungültige Hausnummer in Zeile: "${zeile}"`);
    }

    ergebnis.push({
      strschl: spalten[iStrschl]!,
      strasse: spalten[iName]!.replace(/"/g, ""),
      stadtbezirk: spalten[iStadtbezirk]!.replace(/"/g, ""),
      hausnummer,
      zusatz: (spalten[iZusatz] ?? "").replace(/"/g, "").trim().toLowerCase(),
      wk: spalten[iLwk]!,
    });
  }
  return ergebnis;
}

async function main(): Promise<void> {
  console.log("Lade Duisburger Hausnummernverzeichnis ...");
  const zeilen = await ladeZeilen();
  console.log(`  ${zeilen.length} Zeilen geladen.`);

  const byStrschl = new Map<string, DuisburgZeile[]>();
  for (const zeile of zeilen) {
    const liste = byStrschl.get(zeile.strschl) ?? [];
    liste.push(zeile);
    byStrschl.set(zeile.strschl, liste);
  }

  const physischeStrassen: PhysischeStrasse[] = [];
  for (const [strschl, rows] of byStrschl) {
    const name = rows[0]!.strasse;
    const stadtbezirk = rows[0]!.stadtbezirk;
    const rohZeilen = komprimiereZuBereichen(rows.map((r) => ({ hausnummer: r.hausnummer, wk: r.wk })));
    physischeStrassen.push({
      strschl,
      name,
      stadtbezirk,
      ergebnis: gruppiereZuStrasse(name, rohZeilen),
    });
  }

  const strassen = benenneMehrdeutigeNamen(physischeStrassen);
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));

  const namen = new Set<string>();
  for (const s of strassen) {
    if (namen.has(s.n)) {
      throw new BuildError(`Doppelter Straßenname nach Disambiguierung: "${s.n}"`);
    }
    namen.add(s.n);
  }

  checkWahlkreisCount(DUISBURG_WAHLKREISE, 3);

  // Buchstaben-Prüfung: Straßen können oben umbenannt worden sein ("Ackerstr. (Süd)").
  const stadtbezirkVon = new Map(physischeStrassen.map((p) => [p.strschl, p.stadtbezirk]));
  const buchstabenAdressen: BuchstabenAdresse[] = [];
  for (const z of zeilen) {
    if (!z.zusatz) continue;
    const bezirk = stadtbezirkVon.get(z.strschl);
    const kandidaten = [`${z.strasse} (${bezirk}, ${z.strschl})`, `${z.strasse} (${bezirk})`, z.strasse];
    const strasse = kandidaten.find((k) => namen.has(k)) ?? z.strasse;
    buchstabenAdressen.push({ strasse, nummer: z.hausnummer, zusatz: z.zusatz, wk: z.wk });
  }
  await berichteBuchstaben("Duisburg", buchstabenAdressen, strassen);

  const conflicts = runVollscan(strassen);
  if (conflicts.length > 0) {
    for (const c of conflicts) {
      console.error(
        `Mehrdeutiger Treffer: ${c.strasse} Hausnummer ${c.hausnummer} -> ${c.wks.join(", ")}`,
      );
    }
    throw new BuildError(`${conflicts.length} mehrdeutige Treffer im Vollscan.`);
  }

  const gaps = findGaps(strassen);

  const distinctWkCount = (s: Strasse): number =>
    "wk" in s ? 1 : new Set(s.b.map((b) => b.wk).filter((wk) => wk !== null)).size;
  const eindeutig = strassen.filter((s) => distinctWkCount(s) === 1).length;
  const geteilt = strassen.length - eindeutig;

  const data: StrassenDaten = {
    meta: {
      kommune: "Duisburg",
      stand: DUISBURG_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [DUISBURG_QUELLE_URL],
      zuordnung: "amtlich",
    },
    wahlkreise: DUISBURG_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Zeilen (aktuell): ${zeilen.length}`);
  console.log(`Physische Straßen (STRSCHL): ${byStrschl.size}`);
  console.log(`Straßen gesamt (nach Namen): ${strassen.length}`);
  console.log(`  davon in genau einem Wahlkreis: ${eindeutig}`);
  console.log(`  davon über mehrere Wahlkreise: ${geteilt}`);
  console.log(`Mehrdeutige Treffer im Vollscan: ${conflicts.length}`);
  if (gaps.length > 0) {
    console.log(`\nInfo: ${gaps.length} Lücke(n) in Hausnummernbereichen (unauffällig, da pro Adresse geliefert).`);
  }
  console.log(`\n${OUTPUT_PATH} geschrieben.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
