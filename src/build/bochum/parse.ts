const ADRESSE_RE = /^(.+?)\s+(\d+)\s*([a-zA-Z]?)$/;

export interface GeparsteAdresse {
  strasse: string;
  hausnummer: number;
  suffix: string;
}

/**
 * "AD_STRHNR" ist unverarbeiteter Adresstext ("Achtermannstr. 1",
 * "Adlerstr. 18 a" - Buchstabenzusatz durch Leerzeichen getrennt). Straßen
 * ganz ohne Hausnummer (Brücken, Plätze ohne Adressierung) liefern `null` -
 * betrifft nur 88 von 65.822 Zeilen, alle mit einer nummerierten
 * Schwesterzeile für dieselbe Straße, also ohne Informationsverlust
 * überspringbar.
 */
export function parseAdresse(adStrHnr: string): GeparsteAdresse | null {
  const match = ADRESSE_RE.exec(adStrHnr.trim());
  if (!match) return null;

  return {
    strasse: match[1]!.trim(),
    hausnummer: parseInt(match[2]!, 10),
    suffix: match[3]!,
  };
}
