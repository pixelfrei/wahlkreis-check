import { writeFile } from "node:fs/promises";
import { STRASSENVERZEICHNIS_DATASET, WAHLRAUM_DATASET } from "./config.js";
import { BuildError, buildStrassen } from "./join.js";
import { fetchAllRecords } from "./opendatasoft.js";
import type {
  StrassenDaten,
  Strasse,
  StrassenverzeichnisRecord,
  WahlraumRecord,
} from "../shared/types.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "./validate.js";

const OUTPUT_PATH = "public/data/dortmund.json";

async function main(): Promise<void> {
  console.log("Lade Straßenverzeichnis ...");
  const strassenRows = await fetchAllRecords<StrassenverzeichnisRecord>(
    STRASSENVERZEICHNIS_DATASET,
  );
  console.log(`  ${strassenRows.length} Zeilen geladen.`);

  console.log("Lade Wahlraumverzeichnis ...");
  const wahlraumRows = await fetchAllRecords<WahlraumRecord>(WAHLRAUM_DATASET);
  console.log(`  ${wahlraumRows.length} Zeilen geladen.`);

  const { strassen, wahlkreise, zeilenOhneStimmbezirk } = buildStrassen(
    strassenRows,
    wahlraumRows,
  );

  checkWahlkreisCount(wahlkreise, 4);

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

  const distinctStimmbezirke = new Set(wahlraumRows.map((r) => r.stimmbezirk)).size;
  // "genau ein Wahlkreis" zählt nach den tatsächlich zugeordneten Wahlkreisen,
  // nicht nach der JSON-Struktur: der Groppenbrucher-Fall landet trotz Bereichsform
  // hier, weil alle amtlich zugeordneten Zeilen 111 sind, nur die eine unklare
  // Zeile daneben null bleibt.
  const distinctWkCount = (s: Strasse): number =>
    "wk" in s ? 1 : new Set(s.b.map((b) => b.wk).filter((wk) => wk !== null)).size;
  const eindeutig = strassen.filter((s) => distinctWkCount(s) === 1).length;
  const geteilt = strassen.length - eindeutig;
  const ueberDreiWahlkreise = strassen.filter(
    (s) => "b" in s && new Set(s.b.map((b) => b.wk).filter((wk) => wk !== null)).size >= 3,
  );

  const stand = wahlraumRows[0]?.datum ?? new Date().toISOString().slice(0, 10);

  const data: StrassenDaten = {
    meta: {
      kommune: "Dortmund",
      stand,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [STRASSENVERZEICHNIS_DATASET, WAHLRAUM_DATASET],
      zuordnung: "amtlich",
    },
    wahlkreise,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Zeilen Straßenverzeichnis: ${strassenRows.length}`);
  console.log(`Stimmbezirke: ${distinctStimmbezirke}`);
  console.log(`Straßen gesamt: ${strassen.length}`);
  console.log(`  davon in genau einem Wahlkreis: ${eindeutig}`);
  console.log(`  davon über mehrere Wahlkreise: ${geteilt}`);
  console.log(`Zeilen ohne Stimmbezirk: ${zeilenOhneStimmbezirk.length}`);
  for (const z of zeilenOhneStimmbezirk) {
    console.log(`  - ${z.strasse} (${z.hausnummernbereich ?? "kein Bereich"})`);
  }
  console.log(`Mehrdeutige Treffer im Vollscan: ${conflicts.length}`);
  if (ueberDreiWahlkreise.length > 0) {
    console.log(
      `Straßen über drei oder mehr Wahlkreise: ${ueberDreiWahlkreise.map((s) => s.n).join(", ")}`,
    );
  }
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
