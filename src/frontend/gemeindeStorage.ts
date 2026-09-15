const KEY = "wahlkreis-check:gemeinde";

/** localStorage kann fehlschlagen (privater Modus etc.) - dann einfach nichts merken. */
export function ladeGespeicherteGemeinde(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function speichereGemeinde(name: string): void {
  try {
    localStorage.setItem(KEY, name);
  } catch {
    // kein Problem, dann wird beim nächsten Start erneut gefragt.
  }
}

export function loescheGespeicherteGemeinde(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // siehe oben
  }
}
