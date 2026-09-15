import { useCallback, useEffect, useState } from "react";

export type Infoseite = "quellen" | "impressum" | "datenschutz";

export const INFOSEITEN: { seite: Infoseite; titel: string }[] = [
  { seite: "quellen", titel: "Datenquellen" },
  { seite: "impressum", titel: "Impressum" },
  { seite: "datenschutz", titel: "Datenschutz" },
];

/** Eigenes Event, weil pushState selbst kein popstate auslöst. */
const NAVIGATION_EVENT = "wahlkreis-check:navigation";

/** Infoseite zum Pfad, auch für alte Links wie "/quellen.html". */
export function infoseiteAusPfad(pathname: string): Infoseite | null {
  const pfad = pathname.replace(/\.html$/, "").replace(/\/+$/, "");
  return INFOSEITEN.find((s) => `/${s.seite}` === pfad)?.seite ?? null;
}

export function navigiere(pfad: string, state: unknown = null): void {
  window.history.pushState(state, "", pfad);
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
}

/** Ruft `aufAenderung` bei Zurück/Vor im Browser und bei navigiere() auf. */
export function usePfadAenderung(aufAenderung: () => void): void {
  useEffect(() => {
    window.addEventListener("popstate", aufAenderung);
    window.addEventListener(NAVIGATION_EVENT, aufAenderung);
    return () => {
      window.removeEventListener("popstate", aufAenderung);
      window.removeEventListener(NAVIGATION_EVENT, aufAenderung);
    };
  }, [aufAenderung]);
}

export function usePfad(): string {
  const [pfad, setPfad] = useState(() => window.location.pathname);
  const aktualisiere = useCallback(() => setPfad(window.location.pathname), []);
  usePfadAenderung(aktualisiere);
  return pfad;
}

interface InfoState {
  /** Wie viele Infoseiten seit dem Verlassen der App im Verlauf liegen. */
  infoTiefe: number;
}

function infoTiefe(): number | null {
  const state = window.history.state as Partial<InfoState> | null;
  return typeof state?.infoTiefe === "number" ? state.infoTiefe : null;
}

/**
 * Öffnet eine Infoseite. Merkt sich im Verlaufseintrag, wie viele Schritte
 * es zurück bis zur App sind - so kann "eine Ebene hoch" genau dorthin
 * zurückspringen, wo man die App verlassen hat.
 */
export function zuInfoseite(seite: Infoseite): void {
  const aufInfoseite = infoseiteAusPfad(window.location.pathname) !== null;
  const bisher = infoTiefe();
  const tiefe = !aufInfoseite ? 1 : bisher !== null ? bisher + 1 : null;
  navigiere(`/${seite}`, tiefe !== null ? ({ infoTiefe: tiefe } satisfies InfoState) : null);
}

/** Von einer Infoseite zurück in die App ("eine Ebene hoch"). */
export function zurApp(appPfad: string): void {
  const tiefe = infoTiefe();
  if (tiefe !== null) {
    window.history.go(-tiefe);
  } else {
    // Seite wurde direkt aufgerufen - es gibt keinen App-Eintrag im Verlauf.
    navigiere(appPfad);
  }
}

/** Sprunglink innerhalb einer Infoseite, ohne zusätzlichen Verlaufseintrag. */
export function ersetzeAnker(anker: string): void {
  window.history.replaceState(window.history.state, "", anker);
}
