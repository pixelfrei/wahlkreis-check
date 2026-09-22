/**
 * Service Worker anmelden: Danach läuft die App auch ohne Netz, samt der
 * Daten aller Städte. Neue Versionen werden nicht stillschweigend
 * eingespielt - `aufNeueVersion` meldet sie, die App fragt den Nutzer.
 */
export function serviceWorkerAnmelden(aufNeueVersion: () => void): void {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").then((registrierung) => {
      if (registrierung.waiting) aufNeueVersion();

      registrierung.addEventListener("updatefound", () => {
        const neue = registrierung.installing;
        neue?.addEventListener("statechange", () => {
          // "installed" mit vorhandenem Controller = neue Version steht bereit
          if (neue.state === "installed" && navigator.serviceWorker.controller) aufNeueVersion();
        });
      });

      // Beim Zurückkehren zur App nach neuen Daten schauen (sofern online).
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && navigator.onLine) {
          void registrierung.update();
        }
      });
    });
  });
}

/** Übernimmt die bereitstehende Version und lädt die App damit neu. */
export function neueVersionUebernehmen(): void {
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.getRegistration().then((registrierung) => {
    registrierung?.waiting?.postMessage("version-uebernehmen");
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {
    once: true,
  });
}
