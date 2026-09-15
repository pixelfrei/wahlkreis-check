import { writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { berichteBuchstaben, buchstabenAusZeilen } from "../buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { KOELN_QUELLE_STAND, KOELN_QUELLE_URL, KOELN_WAHLKREISE } from "./config.js";
import { koelnZeileZuRohZeilen, type KoelnZeile } from "./parse.js";

const OUTPUT_PATH = "public/data/koeln.json";

function zelleAlsText(wert: ExcelJS.CellValue): string | null {
  if (wert === null || wert === undefined) return null;
  const text = String(wert).trim();
  return text.length > 0 ? text : null;
}

async function ladeZeilen(): Promise<KoelnZeile[]> {
  const response = await fetch(KOELN_QUELLE_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${KOELN_QUELLE_URL}`);
  }
  const buffer = await response.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets.find((ws) => ws.name.startsWith("STRAVERZ_WAHL"));
  if (!sheet) {
    throw new BuildError(
      `Kein Arbeitsblatt mit Präfix "STRAVERZ_WAHL" gefunden. Vorhanden: ${workbook.worksheets.map((w) => w.name).join(", ")}`,
    );
  }

  const zeilen: KoelnZeile[] = [];
  // Zeilen 1-3 sind Titel/Gruppen-/Spaltenkopf, Daten beginnen ab Zeile 4.
  for (let i = 4; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const strasse = zelleAlsText(row.getCell(2).value);
    const landtag = zelleAlsText(row.getCell(8).value);
    if (!strasse || !landtag) continue;

    zeilen.push({
      strasse,
      landtag,
      ungeradeVon: zelleAlsText(row.getCell(10).value),
      ungeradeBis: zelleAlsText(row.getCell(11).value),
      geradeVon: zelleAlsText(row.getCell(12).value),
      geradeBis: zelleAlsText(row.getCell(13).value),
    });
  }

  return zeilen;
}

async function main(): Promise<void> {
  console.log("Lade Kölner Straßenverzeichnis (Wahlen) ...");
  const zeilen = await ladeZeilen();
  console.log(`  ${zeilen.length} Zeilen geladen.`);

  const byStrasse = new Map<string, RohZeile[]>();
  for (const zeile of zeilen) {
    const rohZeilen = koelnZeileZuRohZeilen(zeile);
    const liste = byStrasse.get(zeile.strasse) ?? [];
    liste.push(...rohZeilen);
    byStrasse.set(zeile.strasse, liste);
  }

  const strassen: Strasse[] = [];
  for (const [name, rows] of byStrasse) {
    strassen.push(gruppiereZuStrasse(name, rows));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));
  await berichteBuchstaben("Köln", buchstabenAusZeilen(byStrasse), strassen);

  checkWahlkreisCount(KOELN_WAHLKREISE, 7);

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
      kommune: "Köln",
      stand: KOELN_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [KOELN_QUELLE_URL],
      zuordnung: "amtlich",
    },
    wahlkreise: KOELN_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Zeilen Straßenverzeichnis: ${zeilen.length}`);
  console.log(`Straßen gesamt: ${strassen.length}`);
  console.log(`  davon in genau einem Wahlkreis: ${eindeutig}`);
  console.log(`  davon über mehrere Wahlkreise: ${geteilt}`);
  console.log(`Mehrdeutige Treffer im Vollscan: ${conflicts.length}`);
  if (gaps.length > 0) {
    console.log(`\nWarnung: ${gaps.length} Lücke(n) in Hausnummernbereichen:`);
    for (const g of gaps) {
      console.log(`  - ${g.strasse}: ${g.von}-${g.bis} nicht abgedeckt`);
    }
  }
  console.log(`\n${OUTPUT_PATH} geschrieben.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
