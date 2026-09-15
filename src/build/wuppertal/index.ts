import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import {
  WUPPERTAL_ADRESSEN_URL,
  WUPPERTAL_KOMMUNALWAHLBEZIRKE_URL,
  WUPPERTAL_QUELLE_STAND,
  WUPPERTAL_WAHLKREISE,
} from "./config.js";
import { berichteBuchstaben, type BuchstabenAdresse } from "../buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import {
  baueBenanntesPolygonAusRingen,
  findePolygon,
  ringAusGeoJsonPolygon,
  type BenanntesPolygon,
} from "../geo.js";
import { wahlkreisFuer } from "./wahlkreis.js";

const OUTPUT_PATH = "public/data/wuppertal.json";

interface KwbFeature {
  properties: { BEZIRK: string };
  geometry: { coordinates: number[][][] };
}

async function ladeKommunalwahlbezirkPolygone(): Promise<BenanntesPolygon[]> {
  const response = await fetch(WUPPERTAL_KOMMUNALWAHLBEZIRKE_URL);
  if (!response.ok) {
    throw new BuildError(
      `Download fehlgeschlagen (${response.status}): ${WUPPERTAL_KOMMUNALWAHLBEZIRKE_URL}`,
    );
  }
  const json = (await response.json()) as { features?: KwbFeature[]; error?: unknown };
  if (!json.features) {
    throw new BuildError(`Keine Features erhalten: ${JSON.stringify(json.error ?? json)}`);
  }
  return json.features.map((f) =>
    baueBenanntesPolygonAusRingen(f.properties.BEZIRK, [
      ringAusGeoJsonPolygon(f.geometry.coordinates),
    ]),
  );
}

interface AdressFeature {
  properties: { STRNAME: string; HAUSNR: number; ADR_ZUSATZ: string | null };
  geometry: { coordinates: [number, number] };
}

interface Adresspunkt {
  strasse: string;
  hausnummer: number;
  suffix: string;
  punkt: readonly [number, number];
}

async function ladeAdresspunkte(): Promise<Adresspunkt[]> {
  const response = await fetch(WUPPERTAL_ADRESSEN_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${WUPPERTAL_ADRESSEN_URL}`);
  }
  const json = (await response.json()) as { features?: AdressFeature[]; error?: unknown };
  if (!json.features) {
    throw new BuildError(`Keine Features erhalten: ${JSON.stringify(json.error ?? json)}`);
  }
  return json.features.map((f) => ({
    strasse: f.properties.STRNAME,
    hausnummer: f.properties.HAUSNR,
    suffix: f.properties.ADR_ZUSATZ ?? "",
    punkt: f.geometry.coordinates,
  }));
}

/** Adressen mit Buchstabenzusatz und ihrem berechneten Wahlkreis (für die Buchstaben-Prüfung). */
const buchstabenAdressen: BuchstabenAdresse[] = [];

interface HausnummerEintrag {
  wk: string;
  istUnbuchstabiert: boolean;
}

/**
 * Wie bei Bochum/Bielefeld/Aachen: eine unbuchstabierte Zeile ist immer
 * maßgeblich gegenüber buchstabierten Varianten an derselben Hausnummer,
 * falls die per Punkt-in-Polygon ermittelten Wahlkreise auseinanderfallen.
 * Betrifft 5 von den überprüften Hausnummern (Weinberg 8, Käshammer 1/9,
 * Steinberg 1, Zillertal 1) - alle mit einer echten unbuchstabierten
 * Schwesterzeile als Anker.
 */
function baueHausnummernProStrasse(
  punkte: Adresspunkt[],
  polygone: BenanntesPolygon[],
): { byStrasse: Map<string, Map<number, string>>; ohneTreffer: number; mehrdeutig: number } {
  const byStrasse = new Map<string, Map<number, HausnummerEintrag>>();
  let ohneTreffer = 0;
  let mehrdeutig = 0;

  for (const p of punkte) {
    const treffer = findePolygon(p.punkt, polygone);
    if (treffer.length === 0) {
      ohneTreffer++;
      continue;
    }
    if (treffer.length > 1) {
      mehrdeutig++;
      continue;
    }
    const wk = wahlkreisFuer(parseInt(treffer[0]!, 10));
    const istUnbuchstabiert = p.suffix === "";
    if (!istUnbuchstabiert) {
      buchstabenAdressen.push({ strasse: p.strasse, nummer: p.hausnummer, zusatz: p.suffix.trim().toLowerCase(), wk });
    }
    const hausnummern = byStrasse.get(p.strasse) ?? new Map<number, HausnummerEintrag>();
    byStrasse.set(p.strasse, hausnummern);

    const bisherige = hausnummern.get(p.hausnummer);
    if (bisherige === undefined || (istUnbuchstabiert && !bisherige.istUnbuchstabiert)) {
      hausnummern.set(p.hausnummer, { wk, istUnbuchstabiert });
    }
  }

  const ergebnis = new Map<string, Map<number, string>>();
  for (const [strasse, hausnummern] of byStrasse) {
    const flach = new Map<number, string>();
    for (const [hnr, eintrag] of hausnummern) flach.set(hnr, eintrag.wk);
    ergebnis.set(strasse, flach);
  }
  return { byStrasse: ergebnis, ohneTreffer, mehrdeutig };
}

async function main(): Promise<void> {
  console.log("Lade Wuppertaler Kommunalwahlbezirk-Polygone ...");
  const polygone = await ladeKommunalwahlbezirkPolygone();
  console.log(`  ${polygone.length} Polygone geladen.`);

  console.log("Lade Wuppertaler Adresspunkte ...");
  const punkte = await ladeAdresspunkte();
  console.log(`  ${punkte.length} Adresspunkte geladen.`);

  const { byStrasse, ohneTreffer, mehrdeutig } = baueHausnummernProStrasse(punkte, polygone);

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
  await berichteBuchstaben("Wuppertal", buchstabenAdressen, strassen);

  checkWahlkreisCount(WUPPERTAL_WAHLKREISE, 3);

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
      kommune: "Wuppertal",
      stand: WUPPERTAL_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [WUPPERTAL_KOMMUNALWAHLBEZIRKE_URL, WUPPERTAL_ADRESSEN_URL],
      // Adresse -> Kommunalwahlbezirk per Punkt-in-Polygon-Abgleich,
      // Kommunalwahlbezirk -> Wahlkreis aus der Landeswahlgesetz-Anlage
      // (siehe wahlkreis.ts).
      zuordnung: "berechnet",
    },
    wahlkreise: WUPPERTAL_WAHLKREISE,
    strassen,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  console.log("\n--- Report ---");
  console.log(`Adresspunkte: ${punkte.length}`);
  console.log(`  ohne Treffer (außerhalb aller Polygone): ${ohneTreffer}`);
  console.log(`  mehrdeutig (mehrere Polygone): ${mehrdeutig}`);
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
