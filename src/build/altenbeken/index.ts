import { writeFile } from "node:fs/promises";
import type { Strasse, StrassenDaten } from "../../shared/types.js";
import {
  ALTENBEKEN_BBOX,
  ALTENBEKEN_GEBREF_MARKER,
  ALTENBEKEN_GEMEINDE,
  ALTENBEKEN_QUELLE_STAND,
  ALTENBEKEN_WAHLKREISE,
} from "./config.js";
import { berichteBuchstaben } from "../buchstabenPruefung.js";
import { BuildError, gruppiereZuStrasse, type RohZeile } from "../gruppierung.js";
import { checkWahlkreisCount, findGaps, runVollscan } from "../validate.js";
import { ALKIS_KATASTERBEZIRK_URL, ladeGemarkungen } from "../alkisGemarkung.js";
import { GEBREF_URL, ladeGebrefAdressen } from "../gebref.js";
import { ordneAdressenZu } from "../punktZuordnung.js";
import { wahlkreisFuerGemarkung } from "./wahlkreis.js";

const OUTPUT_PATH = "public/data/altenbeken.json";

async function main(): Promise<void> {
  console.log("Lade Altenbekener Gemarkungsgrenzen (ALKIS) ...");
  const polygone = await ladeGemarkungen(ALTENBEKEN_BBOX, ALTENBEKEN_GEMEINDE);
  console.log(`  ${polygone.length} Gemarkungen geladen: ${polygone.map((p) => p.name).join(", ")}`);

  console.log("Lade und filtere landesweite Gebäudereferenzen auf Altenbeken ...");
  const punkte = await ladeGebrefAdressen(ALTENBEKEN_GEBREF_MARKER);
  console.log(`  ${punkte.length} Adresspunkte geladen.`);

  const { byStrasse, ohneTreffer, mehrdeutig, buchstabenAdressen } = ordneAdressenZu(
    punkte,
    polygone,
    wahlkreisFuerGemarkung,
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
  await berichteBuchstaben("Altenbeken", buchstabenAdressen, strassen);

  checkWahlkreisCount(ALTENBEKEN_WAHLKREISE, 2);

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
      kommune: "Altenbeken",
      stand: ALTENBEKEN_QUELLE_STAND,
      gebaut_am: new Date().toISOString().slice(0, 10),
      quellen: [ALKIS_KATASTERBEZIRK_URL, GEBREF_URL],
      // Adresse -> Gemarkung (= Ortsteil) per Punkt-in-Polygon-Abgleich,
      // Ortsteil -> Wahlkreis aus der Landeswahlgesetz-Anlage (siehe
      // wahlkreis.ts).
      zuordnung: "berechnet",
    },
    wahlkreise: ALTENBEKEN_WAHLKREISE,
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
