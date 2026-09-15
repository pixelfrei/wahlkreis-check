const HAUSNUMMER_RE = /^(\d+)\s*([a-zA-Z]?)$/;

export interface GeparsteHausnummer {
  hausnummer: number;
  suffix: string;
}

/** "hausnr" ist z.B. "10" oder "15 a" (Buchstabenzusatz durch Leerzeichen getrennt). */
export function parseHausnummer(hausnr: string): GeparsteHausnummer | null {
  const match = HAUSNUMMER_RE.exec(hausnr.trim());
  if (!match) return null;
  return { hausnummer: parseInt(match[1]!, 10), suffix: match[2]! };
}
