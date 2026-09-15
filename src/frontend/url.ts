import { normalize } from "./search.js";
import type { GemeindeEintrag } from "../shared/types.js";

/** Erstes Pfadsegment der aktuellen URL, normalisiert. null bei "/". */
export function slugAusPfad(pathname: string): string | null {
  const segment = pathname.replace(/^\/+/, "").split("/")[0];
  return segment ? normalize(segment) : null;
}

export function gemeindeSlug(name: string): string {
  return normalize(name);
}

export function findeGemeindeAnhandSlug(
  gemeinden: GemeindeEintrag[],
  slug: string,
): GemeindeEintrag | null {
  return gemeinden.find((g) => gemeindeSlug(g.name) === slug) ?? null;
}
