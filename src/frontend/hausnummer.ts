export interface EingegebeneHausnummer {
  nummer: number;
  zusatz: string;
}

/**
 * Liest aus einer Nutzereingabe den ersten zusammenhängenden Ziffernblock als
 * Nummer, der Rest danach als Zusatz. "40 a", "40a", "40A" und "Nr. 40a"
 * ergeben alle 40 mit Zusatz "a".
 */
export function parseEingabe(input: string): EingegebeneHausnummer | null {
  const match = /(\d+)\s*(.*)/.exec(input.trim());
  if (!match) return null;
  const [, nummer, rest] = match;
  return { nummer: parseInt(nummer!, 10), zusatz: rest!.trim() };
}
