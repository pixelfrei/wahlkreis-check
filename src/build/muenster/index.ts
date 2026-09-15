import { writeFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { MUENSTER_QUELLE_STAND, MUENSTER_QUELLE_URL, MUENSTER_WAHLKREISE } from "./config.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { parseRohtext } from "./parse.js";
import { wahlkreisFuer } from "./wahlkreis.js";

const OUTPUT_PATH = "public/data/muenster.json";

/**
 * Werneweg hat an der Grenze zwischen Stimmbezirk 135 (Mitte) und 261
 * (Hiltrup) zwei benachbarte Zeilen "077 - 137a" (Mitte) und "137b - 137c"
 * (Hiltrup) - beide Buchstabenvarianten reduzieren sich beim Entfernen des
 * Buchstabens auf dieselbe Zahl 137 und erzeugen dadurch einen echten
 * Vollscan-Konflikt. Wie schon bei anderen Städten (z.B. Dortmund Schilfweg)
 * gehört die reine Basisnummer zu der Seite, deren Bereich mit dem
 * Buchstabenzusatz endet (hier Mitte, "137a") - die Hiltrup-Zeile "137b -
 * 137c" deckt danach keine ganzzahlige Hausnummer mehr ab und wird entfernt.
 */
function istUeberflüssigDurchBuchstabenzusatzKonflikt(zeile: {
  strasse: string;
  von: number | null;
  bis: number | null;
  stimmbezirk: number;
}): boolean {
  return (
    zeile.strasse === "Werneweg" &&
    zeile.von === 137 &&
    zeile.bis === 137 &&
    zeile.stimmbezirk === 261
  );
}

async function ladeRohtext(): Promise<string> {
  const response = await fetch(MUENSTER_QUELLE_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${MUENSTER_QUELLE_URL}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function main(): Promise<void> {
  console.log("Lade Münsteraner Straßenverzeichnis (PDF) ...");
  const text = await ladeRohtext();
  const zeilen = parseRohtext(text).filter((z) => !istUeberflüssigDurchBuchstabenzusatzKonflikt(z));
  console.log(`  ${zeilen.length} Zeilen geladen.`);

  const byStrasse = new Map<string, RohZeile[]>();
  for (const zeile of zeilen) {
    const wk = wahlkreisFuer(zeile.stimmbezirk);
    const liste = byStrasse.get(zeile.strasse) ?? [];
    liste.push({ von: zeile.von, bis: zeile.bis, par: zeile.par, wk });
    byStrasse.set(zeile.strasse, liste);
  }

  const strassen: Strasse[] = [];
  for (const [name, rows] of byStrasse) {
    strassen.push(gruppiereZuStrasse(name, rows));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));

  checkWahlkreisCount(MUENSTER_WAHLKREISE, 3);

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
      kommune: "Münster",
      stand: MUENSTER_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [MUENSTER_QUELLE_URL],
      // Straße -> Stimmbezirk aus dem Straßenverzeichnis, Stimmbezirk ->
      // Kommunalwahlbezirk-Nummer (durch 10 geteilt) -> Landtagswahlkreis aus
      // der Landeswahlgesetz-Anlage (siehe wahlkreis.ts).
      zuordnung: "gesetzesanlage",
    },
    wahlkreise: MUENSTER_WAHLKREISE,
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
    console.log(`\nWarnung: ${gaps.length} Lücke(n) in Hausnummernbereichen (nur erste 20):`);
    for (const g of gaps.slice(0, 20)) {
      console.log(`  - ${g.strasse}: ${g.von}-${g.bis} nicht abgedeckt`);
    }
  }
  console.log(`\n${OUTPUT_PATH} geschrieben.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
