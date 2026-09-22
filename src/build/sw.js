// Vorlage für den Service Worker. __VERSION__ und __DATEIEN__ werden beim
// Build ersetzt (siehe src/build/pwaPlugin.ts). Diese Datei läuft im Browser,
// nicht in Node - deshalb schlichtes JavaScript ohne Import.
const VERSION = "__VERSION__";
const CACHE = `wahlkreis-check-${VERSION}`;
const DATEIEN = "__DATEIEN__";

// Beim Installieren alles herunterladen: die App ist danach vollständig offline
// nutzbar, inklusive der Straßendaten aller Städte.
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // In Blöcken, damit nicht alle Anfragen gleichzeitig laufen.
      for (let i = 0; i < DATEIEN.length; i += 10) {
        await Promise.all(DATEIEN.slice(i, i + 10).map((pfad) => speichere(cache, pfad)));
      }
    })(),
  );
});

/**
 * Speichert eine Datei im Cache, mit bereinigten Kopfzeilen:
 * - "content-encoding"/"content-length": Der Cache legt den bereits
 *   entpackten Inhalt ab; bliebe die Kopfzeile stehen, würde der Browser ihn
 *   ein zweites Mal zu entpacken versuchen und die Datei wäre unbrauchbar.
 * - "vary": Sonst gilt ein Eintrag nur für Anfragen mit denselben Kopfzeilen.
 *   Ein Modul-Import schickt z.B. "Origin" mit und fände die Datei nicht mehr.
 */
async function speichere(cache, pfad) {
  const antwort = await fetch(new Request(pfad, { cache: "reload" }));
  if (!antwort.ok) throw new Error(`${pfad}: HTTP ${antwort.status}`);
  const kopfzeilen = new Headers(antwort.headers);
  kopfzeilen.delete("content-encoding");
  kopfzeilen.delete("content-length");
  kopfzeilen.delete("vary");
  await cache.put(
    pfad,
    new Response(await antwort.blob(), {
      status: antwort.status,
      statusText: antwort.statusText,
      headers: kopfzeilen,
    }),
  );
}

// Alte Versionen aufräumen, sobald der neue Stand übernommen wurde.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const namen = await caches.keys();
      await Promise.all(
        namen.filter((n) => n.startsWith("wahlkreis-check-") && n !== CACHE).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

// Die App fragt nach, wenn der Nutzer die neue Version übernehmen will.
self.addEventListener("message", (event) => {
  if (event.data === "version-uebernehmen") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const anfrage = event.request;
  if (anfrage.method !== "GET" || new URL(anfrage.url).origin !== self.location.origin) return;

  // Seitenaufrufe (auch /essen oder /quellen) beantwortet die App selbst.
  if (anfrage.mode === "navigate") {
    event.respondWith(
      (async () => (await caches.match("/index.html", { ignoreVary: true })) ?? fetch(anfrage))(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const gespeichert = await caches.match(anfrage, { ignoreVary: true });
      if (gespeichert) return gespeichert;
      return fetch(anfrage);
    })(),
  );
});
