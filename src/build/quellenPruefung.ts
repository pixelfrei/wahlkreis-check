import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { NICHT_AUS_RECHENZENTREN, sammleQuellen, type Quelle } from "./quellenListe.js";

/**
 * Prüft, ob sich eine der Quellen geändert hat, aus denen die Straßendaten
 * entstehen. Ohne Download der kompletten Datei, wo es der Server erlaubt:
 * ETag oder Änderungsdatum genügen als Fingerabdruck, sonst die Länge, sonst
 * der Inhalt selbst.
 *
 *   npm run check:quellen                 prüft gegen den gespeicherten Stand
 *   npm run check:quellen -- --uebernehmen  schreibt den aktuellen Stand fest
 *
 * Beendet sich mit Code 1, wenn sich etwas geändert hat oder eine Quelle nicht
 * erreichbar war - so fällt es in einer automatischen Prüfung auf.
 */
const STAND_DATEI = "docs/quellen-stand.json";
const GLEICHZEITIG = 6;
/** Größere Dateien werden nicht heruntergeladen, nur ihre Kopfzeilen geprüft. */
const MAX_DOWNLOAD = 20 * 1024 * 1024;
const KENNUNG = "wahlkreis-check-quellenpruefung (+https://github.com/pixelfrei/wahlkreis-check)";

export interface QuellStand {
  stadt: string;
  namen: string[];
  fingerabdruck: string;
  status: number;
}

interface StandDatei {
  geprueft_am: string;
  quellen: Record<string, QuellStand>;
}

/**
 * Fingerabdruck einer Antwort. Änderungsdatum und Länge zuerst: Sie sind am
 * verlässlichsten. ETags enthalten bei manchen Servern Datei-Interna, die sich
 * je nach Server-Knoten unterscheiden - von zwei Rechnern aus gefragt kämen
 * dann unterschiedliche Werte, obwohl sich nichts geändert hat (beobachtet bei
 * Bad Oeynhausen). Bleibt beides aus, hilft der Inhalt selbst.
 */
export function fingerabdruckAus(
  kopfzeilen: Headers,
  koerperHash?: string,
): { art: string; wert: string } {
  const geaendert = kopfzeilen.get("last-modified");
  const laenge = kopfzeilen.get("content-length");
  if (geaendert) return { art: "geändert am", wert: laenge ? `${geaendert} (${laenge} Bytes)` : geaendert };
  const etag = kopfzeilen.get("etag");
  if (etag) return { art: "etag", wert: etag.replace(/^W\//, "") };
  if (koerperHash) return { art: "inhalt", wert: koerperHash };
  if (laenge) return { art: "länge", wert: laenge };
  return { art: "unbekannt", wert: "" };
}

/**
 * Teile der Antwort, die sich bei jeder Anfrage ändern, ohne dass sich die
 * Daten geändert haben - sonst meldet die Prüfung ständig falschen Alarm.
 * Beobachtet bei GeoServer-Diensten (Aachen, Marl): Zeitstempel der Antwort
 * und bei jeder Anfrage neu vergebene Feature-Kennungen.
 */
const FLUECHTIG: RegExp[] = [
  /timeStamp="[^"]*"/g,
  /fid-[0-9a-zA-Z_-]+/g,
  /gml:id="[^"]*"/g,
];

/**
 * Bringt eine Antwort in eine vergleichbare Form. Neben den flüchtigen
 * Stellen ist auch die Reihenfolge nicht verlässlich: Dieselbe Abfrage
 * liefert bei GeoServer-Diensten dieselben Datensätze in wechselnder
 * Reihenfolge, deshalb wird zeilen- bzw. objektweise sortiert.
 */
export function kanonischerInhalt(text: string, inhaltsTyp: string): string {
  const ohne = FLUECHTIG.reduce((t, muster) => t.replace(muster, ""), text);

  if (inhaltsTyp.includes("json")) {
    try {
      const daten = JSON.parse(ohne) as { features?: { properties?: unknown; geometry?: unknown }[] };
      if (Array.isArray(daten.features)) {
        return daten.features
          .map((f) => JSON.stringify({ eigenschaften: f.properties, geometrie: f.geometry }))
          .sort()
          .join("\n");
      }
    } catch {
      // kein JSON wie erwartet - unten normal weiterverarbeiten
    }
  }

  const zeilen = ohne.split(/\r?\n/);
  if (zeilen.length < 3) return ohne;
  // Führende, pro Anfrage vergebene Kennung entfernen (z.B. "ac_adressen.-1644,")
  return zeilen.map((z) => z.replace(/^[A-Za-z_][A-Za-z0-9_]*\.-?[0-9]+,/, "")).sort().join("\n");
}

function istText(kopfzeilen: Headers): boolean {
  const typ = kopfzeilen.get("content-type") ?? "";
  return /json|xml|text|csv|html/.test(typ);
}

/** Lädt den Inhalt und bildet seine Prüfsumme - bricht bei zu großen Dateien ab. */
async function koerperHash(antwort: Response): Promise<string | undefined> {
  const laenge = Number(antwort.headers.get("content-length") ?? 0);
  if (laenge > MAX_DOWNLOAD || !antwort.body) return undefined;

  const hash = createHash("sha256");
  if (istText(antwort.headers)) {
    const text = await antwort.text();
    if (text.length > MAX_DOWNLOAD) return undefined;
    hash.update(kanonischerInhalt(text, antwort.headers.get("content-type") ?? ""));
    return hash.digest("hex").slice(0, 16);
  }

  let gelesen = 0;
  for await (const stueck of antwort.body as unknown as AsyncIterable<Uint8Array>) {
    gelesen += stueck.length;
    if (gelesen > MAX_DOWNLOAD) return undefined;
    hash.update(stueck);
  }
  return hash.digest("hex").slice(0, 16);
}

/** Einzelne Aussetzer kommen vor - ein zweiter Versuch spart Fehlalarm. */
async function holeMitZweitemVersuch(url: string, optionen: RequestInit): Promise<Response> {
  try {
    return await fetch(url, optionen);
  } catch (ursache) {
    await new Promise((fertig) => setTimeout(fertig, 3000));
    try {
      return await fetch(url, optionen);
    } catch {
      throw ursache;
    }
  }
}

async function pruefeQuelle(
  url: string,
  inhaltPruefen = false,
): Promise<{ fingerabdruck: string; status: number }> {
  const optionen = { headers: { "user-agent": KENNUNG } };
  let antwort = inhaltPruefen
    ? await holeMitZweitemVersuch(url, optionen)
    : await holeMitZweitemVersuch(url, { ...optionen, method: "HEAD" });

  // Manche Server kennen HEAD nicht oder liefern dabei nichts Brauchbares.
  const brauchbar = antwort.headers.get("last-modified") ?? antwort.headers.get("etag");
  if (inhaltPruefen) {
    const hash = antwort.ok ? await koerperHash(antwort) : undefined;
    return { fingerabdruck: `inhalt:${hash ?? "?"}`, status: antwort.status };
  }
  if (!antwort.ok || !brauchbar) {
    antwort = await holeMitZweitemVersuch(url, optionen);
    const hash = antwort.ok ? await koerperHash(antwort) : undefined;
    const { art, wert } = fingerabdruckAus(antwort.headers, hash);
    return { fingerabdruck: `${art}:${wert}`, status: antwort.status };
  }

  const { art, wert } = fingerabdruckAus(antwort.headers);
  return { fingerabdruck: `${art}:${wert}`, status: antwort.status };
}

/** Quellen mit derselben Prüf-Adresse nur einmal abfragen. */
export function fasseQuellenZusammen(
  quellen: Quelle[],
): Map<string, { stadt: string; namen: string[]; inhaltPruefen: boolean }> {
  const nachUrl = new Map<string, { stadt: string; namen: string[]; inhaltPruefen: boolean }>();
  for (const q of quellen) {
    const adresse = q.pruefUrl ?? q.url;
    const vorhanden = nachUrl.get(adresse);
    if (vorhanden) {
      vorhanden.namen.push(`${q.stadt}/${q.name}`);
      vorhanden.inhaltPruefen ||= q.inhaltPruefen ?? false;
    } else {
      nachUrl.set(adresse, {
        stadt: q.stadt,
        namen: [`${q.stadt}/${q.name}`],
        inhaltPruefen: q.inhaltPruefen ?? false,
      });
    }
  }
  return nachUrl;
}

async function ladeStand(): Promise<StandDatei | null> {
  try {
    return JSON.parse(await readFile(STAND_DATEI, "utf-8")) as StandDatei;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const uebernehmen = process.argv.includes("--uebernehmen");
  // In einer automatischen Prüfung (GitHub setzt CI=true) die Quellen auslassen,
  // die aus Rechenzentren nicht erreichbar sind - sonst schlägt jeder Lauf fehl.
  const imRechenzentrum = process.env.CI === "true" && !process.argv.includes("--alle");
  const alleQuellen = await sammleQuellen();
  const uebersprungen = imRechenzentrum
    ? alleQuellen.filter((q) => NICHT_AUS_RECHENZENTREN.has(q.name))
    : [];
  const quellen = fasseQuellenZusammen(
    alleQuellen.filter((q) => !uebersprungen.includes(q)),
  );
  const alt = await ladeStand();
  console.log(`Prüfe ${quellen.size} Quellen ...${alt ? "" : " (noch kein gespeicherter Stand)"}`);

  const neu: StandDatei = { geprueft_am: new Date().toISOString().slice(0, 10), quellen: {} };
  const geaendert: string[] = [];
  const fehler: string[] = [];
  const eintraege = [...quellen.entries()];

  for (let i = 0; i < eintraege.length; i += GLEICHZEITIG) {
    await Promise.all(
      eintraege.slice(i, i + GLEICHZEITIG).map(async ([url, { stadt, namen, inhaltPruefen }]) => {
        try {
          const { fingerabdruck, status } = await pruefeQuelle(url, inhaltPruefen);
          neu.quellen[url] = { stadt, namen, fingerabdruck, status };
          const vorher = alt?.quellen[url];
          if (status >= 400) fehler.push(`${namen.join(", ")}: HTTP ${status}\n    ${url}`);
          else if (vorher && vorher.fingerabdruck !== fingerabdruck) {
            geaendert.push(
              `${namen.join(", ")}\n    vorher: ${vorher.fingerabdruck}\n    jetzt:  ${fingerabdruck}\n    ${url}`,
            );
          }
        } catch (ursache) {
          fehler.push(`${namen.join(", ")}: ${(ursache as Error).message}\n    ${url}`);
          const vorher = alt?.quellen[url];
          if (vorher) neu.quellen[url] = vorher; // Stand nicht wegen eines Netzfehlers verlieren
        }
      }),
    );
  }

  if (uebersprungen.length > 0) {
    console.log(
      `\nÜbersprungen (aus Rechenzentren nicht erreichbar, bitte lokal prüfen):\n  ` +
        uebersprungen.map((q) => `${q.stadt}/${q.name}`).join("\n  "),
    );
    // Stand dieser Quellen unverändert übernehmen, damit er nicht verloren geht.
    for (const q of uebersprungen) {
      const adresse = q.pruefUrl ?? q.url;
      const vorher = alt?.quellen[adresse];
      if (vorher) neu.quellen[adresse] = vorher;
    }
  }

  const unbekannt = Object.values(neu.quellen).filter((q) => q.fingerabdruck.startsWith("unbekannt"));
  const unveraendert = Object.keys(neu.quellen).length - geaendert.length - fehler.length;
  console.log(`\n${unveraendert} unverändert, ${geaendert.length} geändert, ${fehler.length} nicht erreichbar`);
  if (unbekannt.length > 0) {
    console.log(`(${unbekannt.length} Quellen liefern keinen verwertbaren Fingerabdruck)`);
  }
  for (const eintrag of geaendert) console.log(`\nGEÄNDERT  ${eintrag}`);
  for (const eintrag of fehler) console.log(`\nFEHLER    ${eintrag}`);

  if (uebernehmen) {
    await writeFile(STAND_DATEI, `${JSON.stringify(neu, null, 2)}\n`, "utf-8");
    console.log(`\n${STAND_DATEI} geschrieben.`);
    return;
  }

  if (geaendert.length > 0) {
    console.log(
      `\nNächster Schritt: betroffene Stadt neu bauen (npm run build:data:<stadt>), Änderungen prüfen,` +
        `\ndann den Stand mit "npm run check:quellen -- --uebernehmen" festschreiben.`,
    );
  }
  if (geaendert.length > 0 || fehler.length > 0) process.exitCode = 1;
}

if (process.argv[1]?.endsWith("quellenPruefung.ts")) {
  main().catch((fehler: unknown) => {
    console.error(fehler);
    process.exit(1);
  });
}
