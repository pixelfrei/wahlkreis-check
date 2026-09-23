import { BOCHUM_ADRESSEN_URL } from "../../../src/build/bochum/config.js";
import { HAGEN_STRASSEN_URL } from "../../../src/build/hagen/config.js";
import { JUECHEN_STRASSEN_URL } from "../../../src/build/juechen/config.js";
import { MOENCHENGLADBACH_STRASSEN_URL } from "../../../src/build/moenchengladbach/config.js";

/**
 * Vier Städte sperren Anfragen aus Rechenzentren aus; die wöchentliche
 * Quellenprüfung bei GitHub erreicht sie deshalb nicht. Aus dem
 * Cloudflare-Netz heraus antworten sie dagegen (gemessen am 2026-09-23).
 * Dieser Worker reicht genau diese vier Adressen durch - kein offener
 * Weiterleitungsdienst: andere Adressen sind nicht abrufbar.
 *
 * Deploy: npm run deploy:quellen-helfer
 */
const ERLAUBTE_QUELLEN: Record<string, string> = {
  // Bochums Kartendienst liefert ohne Parameter nur eine Info-Seite, deshalb
  // hier dieselbe Zähl-Abfrage wie in src/build/quellenListe.ts.
  BOCHUM_ADRESSEN_URL: `${BOCHUM_ADRESSEN_URL}?where=1%3D1&returnCountOnly=true&f=json`,
  HAGEN_STRASSEN_URL,
  JUECHEN_STRASSEN_URL,
  MOENCHENGLADBACH_STRASSEN_URL,
};

const WEITERGEREICHTE_KOPFZEILEN = ["content-type", "content-length", "last-modified", "etag"];

export default {
  async fetch(anfrage: Request): Promise<Response> {
    const quelle = new URL(anfrage.url).searchParams.get("quelle") ?? "";
    const ziel = ERLAUBTE_QUELLEN[quelle];
    if (!ziel) {
      return new Response(
        `Unbekannte Quelle. Erlaubt: ${Object.keys(ERLAUBTE_QUELLEN).join(", ")}\n`,
        { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    const antwort = await fetch(ziel, {
      method: anfrage.method === "HEAD" ? "HEAD" : "GET",
      signal: AbortSignal.timeout(25000),
    });

    const kopfzeilen = new Headers();
    for (const name of WEITERGEREICHTE_KOPFZEILEN) {
      const wert = antwort.headers.get(name);
      if (wert) kopfzeilen.set(name, wert);
    }
    return new Response(anfrage.method === "HEAD" ? null : antwort.body, {
      status: antwort.status,
      headers: kopfzeilen,
    });
  },
};
