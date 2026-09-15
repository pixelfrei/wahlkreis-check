import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { BOCHUM_ADRESSEN_URL, BOCHUM_QUELLE_STAND, BOCHUM_WAHLKREISE } from "./config.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { wahlkreisFuer } from "./wahlkreis.js";
import { parseAdresse } from "./parse.js";

const OUTPUT_PATH = "public/data/bochum.json";
const SEITENGROESSE = 1000;

interface ArcgisAttribute {
  AD_STRHNR: string;
  KWBezirk: number;
}

async function ladeObjectIds(): Promise<number[]> {
  const url = `${BOCHUM_ADRESSEN_URL}?where=1%3D1&returnIdsOnly=true&f=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${url}`);
  }
  const json = (await response.json()) as { objectIds?: number[]; error?: unknown };
  if (!json.objectIds) {
    throw new BuildError(`Keine objectIds erhalten: ${JSON.stringify(json.error ?? json)}`);
  }
  return json.objectIds.slice().sort((a, b) => a - b);
}

async function ladeSeite(minId: number, maxId: number): Promise<ArcgisAttribute[]> {
  const where = encodeURIComponent(`FID>=${minId} AND FID<=${maxId}`);
  const url = `${BOCHUM_ADRESSEN_URL}?where=${where}&outFields=AD_STRHNR,KWBezirk&returnGeometry=false&f=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${url}`);
  }
  const json = (await response.json()) as {
    features?: { attributes: ArcgisAttribute }[];
    error?: unknown;
  };
  if (!json.features) {
    throw new BuildError(`Keine Features erhalten: ${JSON.stringify(json.error ?? json)}`);
  }
  return json.features.map((f) => f.attributes);
}

async function ladeAlleAdressen(): Promise<ArcgisAttribute[]> {
  const ids = await ladeObjectIds();
  const ergebnis: ArcgisAttribute[] = [];
  for (let i = 0; i < ids.length; i += SEITENGROESSE) {
    const seite = ids.slice(i, i + SEITENGROESSE);
    const attrs = await ladeSeite(seite[0]!, seite[seite.length - 1]!);
    ergebnis.push(...attrs);
  }
  return ergebnis;
}

/**
 * Baut aus den rohen Adresszeilen eine Map Straße -> (Hausnummer -> WK).
 * Mehrere Zeilen mit demselben Straßennamen und derselben Hausnummer, aber
 * unterschiedlichem Buchstabenzusatz (z.B. "Hermannshöhe 5a" und
 * "Hermannshöhe 5b"), können unterschiedliche Kommunalwahlbezirke tragen -
 * unser Datenmodell kennt aber nur die numerische Hausnummer, keinen
 * Buchstabenzusatz für Einzeladressen. In diesem Fall gilt die Zeile OHNE
 * Buchstabenzusatz (die tatsächliche Adresse "Hermannshöhe 5") als
 * maßgeblich - sie ist direkt verifiziert, keine Vermutung. Betrifft 5 von
 * 55.212 eindeutigen Adressen (alle mit einer echten unbuchstabierten
 * Schwesterzeile als Anker): Hermannshöhe 5, Karl-Arnold-Str. 25,
 * Schnatstr. 5, Steinkuhlstr. 15, Ulmenallee 30.
 */
interface HausnummerEintrag {
  wk: string;
  istUnbuchstabiert: boolean;
}

function baueHausnummernProStrasse(rows: ArcgisAttribute[]): Map<string, Map<number, string>> {
  const byStrasse = new Map<string, Map<number, HausnummerEintrag>>();

  for (const row of rows) {
    const geparst = parseAdresse(row.AD_STRHNR);
    if (!geparst) continue; // Straße ohne Hausnummer, siehe parse.ts

    const wk = wahlkreisFuer(row.KWBezirk);
    const istUnbuchstabiert = geparst.suffix === "";
    const hausnummern = byStrasse.get(geparst.strasse) ?? new Map<number, HausnummerEintrag>();
    byStrasse.set(geparst.strasse, hausnummern);

    const bisherige = hausnummern.get(geparst.hausnummer);
    // Die unbuchstabierte Zeile (falls vorhanden) ist immer maßgeblich,
    // unabhängig von der Reihenfolge im Datensatz - siehe Kommentar oben.
    if (bisherige === undefined || (istUnbuchstabiert && !bisherige.istUnbuchstabiert)) {
      hausnummern.set(geparst.hausnummer, { wk, istUnbuchstabiert });
    }
  }

  const ergebnis = new Map<string, Map<number, string>>();
  for (const [strasse, hausnummern] of byStrasse) {
    const flach = new Map<number, string>();
    for (const [hnr, eintrag] of hausnummern) flach.set(hnr, eintrag.wk);
    ergebnis.set(strasse, flach);
  }
  return ergebnis;
}

async function main(): Promise<void> {
  console.log("Lade Bochumer Adressdaten (ArcGIS-Feature-Service) ...");
  const rows = await ladeAlleAdressen();
  console.log(`  ${rows.length} Adresszeilen geladen.`);

  const byStrasse = baueHausnummernProStrasse(rows);

  const strassen: Strasse[] = [];
  for (const [name, hausnummern] of byStrasse) {
    const rohZeilen: RohZeile[] = [...hausnummern.entries()].map(([hnr, wk]) => ({
      von: hnr,
      bis: hnr,
      par: hnr % 2 === 0 ? "g" : "u",
      wk,
    }));
    strassen.push(gruppiereZuStrasse(name, rohZeilen));
  }
  strassen.sort((a, b) => a.n.localeCompare(b.n, "de"));

  checkWahlkreisCount(BOCHUM_WAHLKREISE, 3);

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
      kommune: "Bochum",
      stand: BOCHUM_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [BOCHUM_ADRESSEN_URL],
      // Adresse -> Kommunalwahlbezirk direkt aus dem städtischen
      // ArcGIS-Adressbestand (Layer "AdressenMitWahllokal"), Kommunalwahlbezirk
      // -> Landtagswahlkreis aus der Landeswahlgesetz-Anlage (siehe
      // wahlkreis.ts).
      zuordnung: "gesetzesanlage",
    },
    wahlkreise: BOCHUM_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Adresszeilen: ${rows.length}`);
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
