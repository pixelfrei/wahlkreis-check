import { BuildError } from "../gruppierung.js";

/**
 * Aus der Anlage zu § 13 Absatz 1 Landeswahlgesetz NRW: Wahlkreis 100
 * ("Paderborn I") umfasst von Altenbeken die Ortsteile Buke und Schwaney,
 * Wahlkreis 101 ("Paderborn II") nur den Ortsteil Altenbeken selbst. Die
 * drei Ortsteile entsprechen exakt den ALKIS-Gemarkungen (siehe
 * ../alkisGemarkung.ts) - alle drei waren bis zur Gebietsreform 1975
 * eigenständige Gemeinden.
 */
export function wahlkreisFuerGemarkung(gemarkung: string): string {
  if (gemarkung === "Altenbeken") return "101";
  if (gemarkung === "Buke" || gemarkung === "Schwaney") return "100";
  throw new BuildError(`Unbekannte Gemarkung "${gemarkung}".`);
}
