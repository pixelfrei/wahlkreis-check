import type { Infoseite } from "../navigation.js";

// Jede Infoseite ist ein eigenes, kleines Bundle - der App-Start lädt sie nicht mit.
const LADER: Record<Infoseite, () => Promise<{ default: string }>> = {
  quellen: () => import("./quellen.html?raw"),
  impressum: () => import("./impressum.html?raw"),
  datenschutz: () => import("./datenschutz.html?raw"),
};

/**
 * Persönliche Angaben (Impressum, verantwortliche Stelle im Datenschutz)
 * gehören ins öffentliche Angebot, aber nicht in ein öffentliches Repository.
 * Liegt neben einer Seite eine Datei "<name>.lokal.html", nimmt der Build
 * diese statt der Fassung mit Platzhaltern. Die lokalen Dateien sind in
 * .gitignore ausgeschlossen (siehe README, Abschnitt "Impressum").
 */
const LOKALE_FASSUNGEN = import.meta.glob("./*.lokal.html", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

function lader(seite: Infoseite): () => Promise<string> {
  const lokal = LOKALE_FASSUNGEN[`./${seite}.lokal.html`];
  return lokal ?? (() => LADER[seite]().then((modul) => modul.default));
}

const laufend = new Map<Infoseite, Promise<string>>();
const geladen = new Map<Infoseite, string>();

/** Inhalt, falls schon geladen - dann kann die Seite ohne Ladeanzeige erscheinen. */
export function geladenerInhalt(seite: Infoseite): string | undefined {
  return geladen.get(seite);
}

export function ladeInfoseite(seite: Infoseite): Promise<string> {
  let versprechen = laufend.get(seite);
  if (!versprechen) {
    versprechen = lader(seite)().then((inhalt) => {
      geladen.set(seite, inhalt);
      return inhalt;
    });
    // Fehlgeschlagene Versuche vergessen. Chrome merkt sich einen gescheiterten
    // Modul-Import allerdings bis zum Neuladen der Seite - siehe seiteNeuLaden().
    versprechen.catch(() => laufend.delete(seite));
    laufend.set(seite, versprechen);
  }
  return versprechen;
}

/**
 * Lädt alle Infoseiten im Hintergrund, sobald der Browser nichts anderes zu tun
 * hat - so erscheinen sie später ohne Wartezeit, ohne den App-Start zu bremsen.
 */
export function infoseitenVorladen(): () => void {
  const verbindung = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (verbindung?.saveData) return () => {};

  function alleLaden() {
    for (const seite of Object.keys(LADER) as Infoseite[]) {
      // Fehler hier ignorieren - beim Öffnen wird es erneut versucht.
      ladeInfoseite(seite).catch(() => {});
    }
  }

  // Safari kennt requestIdleCallback (noch) nicht.
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(alleLaden, { timeout: 5000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(alleLaden, 2000);
  return () => window.clearTimeout(id);
}

const NEU_GELADEN_KEY = "wahlkreis-check:neu-geladen";

/**
 * Nach einem Deploy gibt es die Dateien der alten Version nicht mehr. War die
 * App schon länger offen, schlägt das Nachladen deshalb fehl - einmal neu
 * laden holt die aktuelle Version. Gibt false zurück, wenn das nicht hilft
 * (offline oder gerade erst neu geladen).
 */
/** Ein erneuter import() im selben Dokument hilft nicht; nur Neuladen lädt wirklich neu. */
export function seiteNeuLaden(): void {
  window.location.reload();
}

export function nachDeployNeuLaden(neuLaden = seiteNeuLaden): boolean {
  if (!navigator.onLine) return false;
  try {
    const zuletzt = Number(sessionStorage.getItem(NEU_GELADEN_KEY) ?? 0);
    if (Date.now() - zuletzt < 30_000) return false;
    sessionStorage.setItem(NEU_GELADEN_KEY, String(Date.now()));
  } catch {
    return false;
  }
  neuLaden();
  return true;
}
