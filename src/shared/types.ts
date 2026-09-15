export interface StrassenverzeichnisRecord {
  strasse: string;
  hausnummernbereich: string | null;
  hausnummer_von: string | null;
  hausnummer_bis: string | null;
  stimmbezirk: string | null;
  kommune: string;
}

export interface WahlraumRecord {
  stimmbezirk: string;
  landtagswahlkreis_nr: string;
  landtagswahlkreis: string;
  datum?: string;
}

export type Paritaet = "g" | "u" | "b";

export interface Bereich {
  von: number;
  bis: number;
  par: Paritaet;
  wk: string | null;
  vermutung?: string;
  grund?: string;
}

/**
 * Hausnummern mit Buchstabenzusatz, die in einem anderen Wahlkreis liegen als
 * die Nummer selbst - z.B. { nr: 5, von: "b", bis: "j", wk: "109" } für 5b bis 5j.
 * Gilt die Ausnahme ab einem Buchstaben für alle folgenden, ist bis "z".
 */
export interface BuchstabenAusnahme {
  nr: number;
  von: string;
  bis: string;
  wk: string;
}

export type Strasse =
  | { n: string; wk: string; z?: BuchstabenAusnahme[] }
  | { n: string; b: Bereich[]; z?: BuchstabenAusnahme[] };

export interface StrassenDaten {
  meta: {
    kommune: string;
    stand: string;
    gebaut_am: string;
    quellen: string[];
    zuordnung: "amtlich" | "gesetzesanlage" | "berechnet";
  };
  wahlkreise: Record<string, string>;
  strassen: Strasse[];
}

/** Ein Eintrag im NRW-weiten Gemeinde-Index. */
export type GemeindeEintrag =
  | { name: string; typ: "einfach"; wk: string }
  | { name: string; typ: "geteilt"; verfuegbar: true; datei: string }
  | { name: string; typ: "geteilt"; verfuegbar: false };

export interface GemeindeIndex {
  meta: {
    stand: string;
    quelle: string;
  };
  gemeinden: GemeindeEintrag[];
}
