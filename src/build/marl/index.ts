import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import { MARL_GEBREF_URL, MARL_QUELLE_STAND, MARL_STADTTEILE_URL, MARL_WAHLKREISE } from "./config.js";
import { berichteBuchstaben } from "../buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { type BenanntesPolygon } from "../geo.js";
import { ladeGebrefAdressen } from "../gebref.js";
import { ordneAdressenZu } from "../punktZuordnung.js";
import { parseStadtteilePolygone } from "./parse.js";
import { wahlkreisFuerStadtteil } from "./wahlkreis.js";

const OUTPUT_PATH = "public/data/marl.json";
const GEBREF_MARKER = ";62;Recklinghausen;024;Marl;";

async function ladeStadtteilPolygone(): Promise<BenanntesPolygon[]> {
  const response = await fetch(MARL_STADTTEILE_URL);
  if (!response.ok) {
    throw new BuildError(`Download fehlgeschlagen (${response.status}): ${MARL_STADTTEILE_URL}`);
  }
  return parseStadtteilePolygone(await response.text());
}

async function main(): Promise<void> {
  console.log("Lade Marler Stadtteil-Polygone ...");
  const polygone = await ladeStadtteilPolygone();
  console.log(`  ${polygone.length} Polygone geladen.`);

  console.log("Lade und filtere landesweite Gebäudereferenzen auf Marl ...");
  const punkte = await ladeGebrefAdressen(GEBREF_MARKER);
  console.log(`  ${punkte.length} Adresspunkte geladen.`);

  const { byStrasse, ohneTreffer, mehrdeutig, buchstabenAdressen } = ordneAdressenZu(punkte, polygone, (stadttnr) =>
    wahlkreisFuerStadtteil(parseInt(stadttnr, 10)),
  );

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
  await berichteBuchstaben("Marl", buchstabenAdressen, strassen);

  checkWahlkreisCount(MARL_WAHLKREISE, 2);

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
      kommune: "Marl",
      stand: MARL_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [MARL_STADTTEILE_URL, MARL_GEBREF_URL],
      // Adresse -> Stadtteil per Punkt-in-Polygon-Abgleich, Stadtteil ->
      // Wahlkreis aus der Landeswahlgesetz-Anlage (siehe wahlkreis.ts).
      zuordnung: "berechnet",
    },
    wahlkreise: MARL_WAHLKREISE,
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
