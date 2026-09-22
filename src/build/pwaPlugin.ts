import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { Plugin } from "vite";

/**
 * Erzeugt beim Build einen Service Worker, der die komplette App offline
 * verfügbar macht: Programmcode, Schriften, Symbole und die Daten aller
 * Städte (zusammen rund 0,4 MB übertragen). Ohne zusätzliche Abhängigkeit,
 * damit nachvollziehbar bleibt, was im Hintergrund läuft.
 *
 * Der Cache-Name enthält einen Fingerabdruck über alle Dateien: Ändert sich
 * eine Datei, installiert der Browser den neuen Stand parallel und meldet
 * ihn der App, die dann selbst fragt, ob aktualisiert werden soll.
 */
export function pwaPlugin(): Plugin {
  return {
    name: "wahlkreis-check-pwa",
    apply: "build",
    closeBundle() {
      const verzeichnis = "dist";
      const dateien = sammleDateien(verzeichnis)
        // versteckte Dateien (.DS_Store, .assetsignore) und Quellkarten gehören nicht in den Cache
        .filter((d) => !d.endsWith(".map") && d !== "sw.js" && !d.split("/").some((t) => t.startsWith(".")))
        .sort();

      const fingerabdruck = createHash("sha256");
      for (const datei of dateien) {
        fingerabdruck.update(datei);
        fingerabdruck.update(readFileSync(join(verzeichnis, datei)));
      }
      const version = fingerabdruck.digest("hex").slice(0, 12);

      const vorlage = readFileSync("src/build/sw.js", "utf-8");
      const sw = vorlage
        .replace('"__VERSION__"', `"${version}"`)
        .replace('"__DATEIEN__"', JSON.stringify(dateien.map((d) => `/${d}`), null, 2));
      writeFileSync(join(verzeichnis, "sw.js"), sw);

      const groesse = dateien.reduce((n, d) => n + statSync(join(verzeichnis, d)).size, 0);
      this.info?.(
        `Service Worker: ${dateien.length} Dateien (${(groesse / 1024 / 1024).toFixed(1)} MB) für offline, Version ${version}`,
      );
    },
  };
}

function sammleDateien(wurzel: string, ordner = wurzel): string[] {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((eintrag) => {
    const pfad = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) return sammleDateien(wurzel, pfad);
    return [relative(wurzel, pfad)];
  });
}
