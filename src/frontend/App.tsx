import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  ladeGespeicherteGemeinde,
  loescheGespeicherteGemeinde,
  speichereGemeinde,
} from "./gemeindeStorage.js";
import { parseEingabe } from "./hausnummer.js";
import { ergebnisFuer } from "./lookup.js";
import {
  ersetzeAnker,
  infoseiteAusPfad,
  INFOSEITEN,
  navigiere,
  usePfad,
  usePfadAenderung,
  zuInfoseite,
  zurApp,
  type Infoseite,
} from "./navigation.js";
import { searchGemeinden, searchStrassen } from "./search.js";
import {
  geladenerInhalt,
  infoseitenVorladen,
  ladeInfoseite,
  nachDeployNeuLaden,
  seiteNeuLaden,
} from "./seiten/laden.js";
import type { Bereich, GemeindeEintrag, GemeindeIndex, Strasse, StrassenDaten } from "../shared/types.js";
import { findeGemeindeAnhandSlug, gemeindeSlug, slugAusPfad } from "./url.js";
import { useGemeindeIndex } from "./useGemeindeIndex.js";
import { useStrassenDaten } from "./useStrassenDaten.js";

function titelVon(seite: Infoseite): string {
  return INFOSEITEN.find((s) => s.seite === seite)?.titel ?? "";
}

export function App() {
  const pfad = usePfad();
  const infoseite = infoseiteAusPfad(pfad);
  const [stadt, setStadt] = useState<string | null>(null);

  // Die App bleibt während einer Infoseite unsichtbar erhalten (Eingaben und
  // Ergebnis gehen nicht verloren); ihre Scrollposition wird mitgemerkt.
  const appScrollY = useRef(0);
  const aufInfoseite = useRef(infoseite !== null);

  useEffect(() => infoseitenVorladen(), []);

  useEffect(() => {
    function merken() {
      if (!aufInfoseite.current) appScrollY.current = window.scrollY;
    }
    window.addEventListener("scroll", merken, { passive: true });
    return () => window.removeEventListener("scroll", merken);
  }, []);

  useLayoutEffect(() => {
    const warAufInfoseite = aufInfoseite.current;
    aufInfoseite.current = infoseite !== null;
    if (warAufInfoseite && infoseite === null) window.scrollTo(0, appScrollY.current);
    document.title = infoseite ? `${titelVon(infoseite)} – Wahlkreis-Check` : "Wahlkreis-Check";
    if (infoseite && window.location.pathname.endsWith(".html")) {
      // alte Links wie /quellen.html auf die neue Adresse umschreiben
      window.history.replaceState(window.history.state, "", `/${infoseite}${window.location.hash}`);
    }
  }, [infoseite]);

  return (
    <>
      <div hidden={infoseite !== null}>
        <AppInhalt onStadt={setStadt} />
      </div>
      {infoseite && <InfoSeite key={infoseite} seite={infoseite} stadt={stadt} />}
    </>
  );
}

function AppInhalt({ onStadt }: { onStadt: (stadt: string | null) => void }) {
  const indexState = useGemeindeIndex();

  if (indexState.status === "loading") {
    return <StatusScreen text="Lade Daten ..." />;
  }
  if (indexState.status === "error") {
    return <StatusScreen text={`Daten konnten nicht geladen werden: ${indexState.message}`} />;
  }

  return <MitGemeindeIndex index={indexState.data} onStadt={onStadt} />;
}

function StatusScreen({ text, stadt }: { text: string; stadt?: string }) {
  return (
    <AppShell untertitel={stadt}>
      <div className="status-screen">{text}</div>
    </AppShell>
  );
}

function gemeindeAusUrlOderSpeicher(index: GemeindeIndex): string | null {
  const slug = slugAusPfad(window.location.pathname);
  const ausUrl = slug ? findeGemeindeAnhandSlug(index.gemeinden, slug) : null;
  return ausUrl?.name ?? ladeGespeicherteGemeinde();
}

function MitGemeindeIndex({
  index,
  onStadt,
}: {
  index: GemeindeIndex;
  onStadt: (stadt: string | null) => void;
}) {
  const [gemeindeName, setGemeindeName] = useState<string | null>(() =>
    gemeindeAusUrlOderSpeicher(index),
  );

  const eintrag = gemeindeName
    ? (index.gemeinden.find((g) => g.name === gemeindeName) ?? null)
    : null;

  useEffect(() => {
    if (gemeindeName && !eintrag) {
      // gespeicherter/verlinkter Name existiert nicht (mehr) im Index - vergessen, neu fragen.
      loescheGespeicherteGemeinde();
      setGemeindeName(null);
    }
  }, [gemeindeName, eintrag]);

  useEffect(() => {
    onStadt(eintrag?.name ?? null);
  }, [eintrag, onStadt]);

  const aufVerlaufAendern = useCallback(() => {
    // Infoseiten liegen "über" der App - die gewählte Stadt bleibt dabei erhalten.
    if (infoseiteAusPfad(window.location.pathname)) return;
    const slug = slugAusPfad(window.location.pathname);
    const treffer = slug ? findeGemeindeAnhandSlug(index.gemeinden, slug) : null;
    setGemeindeName(treffer?.name ?? null);
  }, [index]);
  usePfadAenderung(aufVerlaufAendern);

  function gemeindeWaehlen(g: GemeindeEintrag) {
    if (g.typ === "geteilt" && g.verfuegbar) {
      speichereGemeinde(g.name);
    }
    setGemeindeName(g.name);
    navigiere(`/${gemeindeSlug(g.name)}`);
  }

  function gemeindeAendern() {
    loescheGespeicherteGemeinde();
    setGemeindeName(null);
    navigiere("/");
  }

  if (!eintrag) {
    return <GemeindeAuswahl gemeinden={index.gemeinden} onWaehlen={gemeindeWaehlen} />;
  }

  if (eintrag.typ === "einfach") {
    return (
      <AppShell untertitel={eintrag.name} onZurueck={gemeindeAendern} onStadtAendern={gemeindeAendern}>
        <div className="seite">
          <ErgebnisKarte wk={eintrag.wk} name="" ort={eintrag.name} />
          <p className="erklaerung">
            {eintrag.name} liegt vollständig in diesem Landtagswahlkreis – eine Straße muss nicht
            gesucht werden.
          </p>
          <PillButton onClick={gemeindeAendern}>Andere Stadt wählen</PillButton>
        </div>
      </AppShell>
    );
  }

  if (!eintrag.verfuegbar) {
    return (
      <AppShell untertitel={eintrag.name} onZurueck={gemeindeAendern} onStadtAendern={gemeindeAendern}>
        <div className="seite">
          <div className="karte hinweis-karte">
            Für {eintrag.name} gibt es in dieser App noch keine genauen Straßendaten.
          </div>
          <PillButton onClick={gemeindeAendern}>Andere Stadt wählen</PillButton>
        </div>
      </AppShell>
    );
  }

  return (
    <StrassenAnwendung
      datei={eintrag.datei}
      stadt={eintrag.name}
      onGemeindeAendern={gemeindeAendern}
    />
  );
}

/* --- Rahmen: Kopfleiste + Menü --- */

/**
 * Kopfleiste + Menü für alle Seiten. Regeln: Der Pfeil führt immer eine Ebene
 * höher und fehlt nur auf der obersten Ebene (Stadtauswahl); das Menü ist
 * überall gleich, die aktuelle Seite ist markiert.
 */
function AppShell({
  untertitel,
  onZurueck,
  zurueckLabel = "Zurück",
  onStadtAendern,
  aktiveSeite,
  appHref = "/",
  onZurApp,
  info,
  children,
}: {
  untertitel?: string;
  onZurueck?: () => void;
  zurueckLabel?: string;
  onStadtAendern?: () => void;
  /** Gesetzt auf Infoseiten; ohne Angabe ist die App selbst die aktuelle Seite. */
  aktiveSeite?: Infoseite;
  appHref?: string;
  /** Auf Infoseiten: zurück in die App. */
  onZurApp?: () => void;
  info?: string[];
  children: ReactNode;
}) {
  const [menuOffen, setMenuOffen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function menuSchliessen() {
    setMenuOffen(false);
    menuButtonRef.current?.focus();
  }

  /** Menü schließen und woandershin wechseln (kein Fokus zurück auf den Menü-Knopf). */
  function menuVerlassen(aktion?: () => void) {
    setMenuOffen(false);
    aktion?.();
  }

  return (
    <div className="app">
      <header className="kopfleiste">
        {onZurueck && (
          <button type="button" className="icon-button" aria-label={zurueckLabel} onClick={onZurueck}>
            <IconPfeilLinks />
          </button>
        )}
        <div className="titel">
          <span className="titel-name">Wahlkreis-Check</span>
          {untertitel && <span className="titel-stadt">{untertitel}</span>}
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className="icon-button"
          aria-label="Menü öffnen"
          aria-expanded={menuOffen}
          onClick={() => setMenuOffen(true)}
        >
          <IconMenu />
        </button>
      </header>
      <main className="inhalt">{children}</main>
      {menuOffen && (
        <Menu
          info={info}
          aktiveSeite={aktiveSeite}
          appHref={appHref}
          onSchliessen={menuSchliessen}
          onWahlkreisSuchen={() => (onZurApp ? menuVerlassen(onZurApp) : menuSchliessen())}
          onInfoseite={(seite) =>
            seite === aktiveSeite ? menuSchliessen() : menuVerlassen(() => zuInfoseite(seite))
          }
          onStadtAendern={onStadtAendern ? () => menuVerlassen(onStadtAendern) : undefined}
        />
      )}
    </div>
  );
}

/** Linksklick ohne Zusatztaste - alles andere (neuer Tab etc.) übernimmt der Browser. */
function istNormalerKlick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

function Menu({
  info,
  aktiveSeite,
  appHref,
  onSchliessen,
  onWahlkreisSuchen,
  onInfoseite,
  onStadtAendern,
}: {
  info?: string[];
  aktiveSeite?: Infoseite;
  appHref: string;
  onSchliessen: () => void;
  onWahlkreisSuchen: () => void;
  onInfoseite: (seite: Infoseite) => void;
  onStadtAendern?: () => void;
}) {
  const schliessenRef = useRef<HTMLButtonElement>(null);
  const onSchliessenRef = useRef(onSchliessen);
  onSchliessenRef.current = onSchliessen;

  useEffect(() => {
    schliessenRef.current?.focus();
    function aufTaste(e: KeyboardEvent) {
      if (e.key === "Escape") onSchliessenRef.current();
    }
    window.addEventListener("keydown", aufTaste);
    return () => window.removeEventListener("keydown", aufTaste);
  }, []);

  return (
    <div className="menu-ebene">
      <div className="menu-hintergrund" onClick={onSchliessen} />
      <nav className="menu" role="dialog" aria-modal="true" aria-label="Menü">
        <div className="menu-kopf">
          <span className="menu-titel">Menü</span>
          <button
            ref={schliessenRef}
            type="button"
            className="icon-button"
            aria-label="Menü schließen"
            onClick={onSchliessen}
          >
            <IconX />
          </button>
        </div>
        <ul className="menu-liste">
          <li>
            <a
              className="menu-eintrag"
              href={appHref}
              aria-current={aktiveSeite ? undefined : "page"}
              onClick={(e) => {
                if (!istNormalerKlick(e)) return;
                e.preventDefault();
                onWahlkreisSuchen();
              }}
            >
              Wahlkreis suchen
            </a>
          </li>
          {onStadtAendern && (
            <li>
              <button type="button" className="menu-eintrag" onClick={onStadtAendern}>
                Stadt ändern
              </button>
            </li>
          )}
        </ul>
        <ul className="menu-liste menu-liste-info">
          {INFOSEITEN.map(({ seite, titel }) => (
            <li key={seite}>
              <a
                className="menu-eintrag"
                href={`/${seite}`}
                aria-current={seite === aktiveSeite ? "page" : undefined}
                onClick={(e) => {
                  if (!istNormalerKlick(e)) return;
                  e.preventDefault();
                  onInfoseite(seite);
                }}
              >
                {titel}
              </a>
            </li>
          ))}
        </ul>
        {info && info.length > 0 && (
          <div className="menu-info">
            {info.map((zeile) => (
              <span key={zeile}>{zeile}</span>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}

/* --- Infoseiten (Datenquellen, Impressum, Datenschutz) --- */

function InfoSeite({ seite, stadt }: { seite: Infoseite; stadt: string | null }) {
  const inhaltRef = useRef<HTMLDivElement>(null);
  const appPfad = stadt ? `/${gemeindeSlug(stadt)}` : "/";
  // Meist schon im Hintergrund vorgeladen - dann ohne Ladeanzeige.
  const [html, setHtml] = useState(() => geladenerInhalt(seite) ?? null);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (geladenerInhalt(seite) !== undefined) return;
    let aktiv = true;
    ladeInfoseite(seite).then(
      (inhalt) => {
        if (aktiv) setHtml(inhalt);
      },
      () => {
        if (aktiv && !nachDeployNeuLaden()) setFehler(true);
      },
    );
    return () => {
      aktiv = false;
    };
  }, [seite]);

  useEffect(() => {
    if (!fehler) return;
    // Ohne Netz gescheitert: automatisch neu laden, sobald die Verbindung zurück ist.
    window.addEventListener("online", seiteNeuLaden);
    return () => window.removeEventListener("online", seiteNeuLaden);
  }, [fehler]);

  useEffect(() => {
    if (html === null) return;
    // Externe Links öffnen in einem neuen Tab, damit die App offen bleibt.
    inhaltRef.current?.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener";
    });
    const anker = window.location.hash.slice(1);
    const ziel = anker ? document.getElementById(decodeURIComponent(anker)) : null;
    ziel?.scrollIntoView?.({ block: "start" });
  }, [html]);

  function aufLinkKlick(e: MouseEvent<HTMLDivElement>) {
    const link = (e.target as Element).closest("a");
    const href = link?.getAttribute("href");
    if (!href || !istNormalerKlick(e)) return;
    if (href.startsWith("#")) {
      const ziel = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!ziel) return;
      e.preventDefault();
      ersetzeAnker(href);
      ziel.scrollIntoView?.({ block: "start" });
    } else if (href.startsWith("/") && !href.startsWith("//")) {
      e.preventDefault();
      const zielSeite = infoseiteAusPfad(href);
      if (zielSeite) zuInfoseite(zielSeite);
      else navigiere(href);
    }
  }

  function stadtAendern() {
    loescheGespeicherteGemeinde();
    navigiere("/");
  }

  return (
    <AppShell
      untertitel={titelVon(seite)}
      onZurueck={() => zurApp(appPfad)}
      zurueckLabel="Zurück zur App"
      aktiveSeite={seite}
      appHref={appPfad}
      onZurApp={() => zurApp(appPfad)}
      onStadtAendern={stadt ? stadtAendern : undefined}
    >
      {html !== null ? (
        // Eigene, statische Inhalte aus src/frontend/seiten/ - kein fremdes HTML.
        <div
          ref={inhaltRef}
          className="seite infoseite"
          onClick={aufLinkKlick}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : fehler ? (
        <div className="seite">
          <div className="karte hinweis-karte">
            Die Seite konnte nicht geladen werden. Bitte prüfe die Internetverbindung – sobald
            sie wieder da ist, wird die Seite automatisch neu geladen.
          </div>
          <PillButton onClick={seiteNeuLaden}>Jetzt neu laden</PillButton>
        </div>
      ) : (
        <div className="status-screen verzoegert">Lade Seite ...</div>
      )}
    </AppShell>
  );
}

/* --- Suche --- */

function Suchfeld({
  value,
  onChange,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="suchfeld">
      <IconLupe />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder.replace(/\s*\.\.\.$/, "")}
        autoComplete="off"
        autoFocus
      />
      {value.length > 0 && (
        <button
          type="button"
          className="icon-button leeren"
          aria-label="Eingabe löschen"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          <IconX />
        </button>
      )}
    </div>
  );
}

function Hervorgehoben({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLocaleLowerCase("de");
  const lower = text.toLocaleLowerCase("de");
  const index = q.length > 0 && lower.length === text.length ? lower.indexOf(q) : -1;
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
}

function Trefferliste<T>({
  query,
  treffer,
  nameVon,
  zusatzVon,
  onWaehlen,
  leerHinweis,
}: {
  query: string;
  treffer: T[];
  nameVon: (item: T) => string;
  zusatzVon?: (item: T) => ReactNode;
  onWaehlen: (item: T) => void;
  leerHinweis: string;
}) {
  if (query.trim().length === 0) {
    return <p className="leer-hinweis">{leerHinweis}</p>;
  }
  if (treffer.length === 0) {
    return <p className="leer-hinweis">Keine Treffer für „{query.trim()}“.</p>;
  }
  return (
    <ul className="trefferliste karte">
      {treffer.map((item) => (
        <li key={nameVon(item)}>
          <button type="button" onClick={() => onWaehlen(item)}>
            <span className="treffer-name">
              <Hervorgehoben text={nameVon(item)} query={query} />
              {zusatzVon?.(item)}
            </span>
            <IconPfeilRechts />
          </button>
        </li>
      ))}
    </ul>
  );
}

function GemeindeAuswahl({
  gemeinden,
  onWaehlen,
}: {
  gemeinden: GemeindeEintrag[];
  onWaehlen: (gemeinde: GemeindeEintrag) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const matches = query.trim().length > 0 ? searchGemeinden(query, gemeinden) : [];

  return (
    <AppShell>
      <div className="seite">
        <h1 className="seiten-titel">In welcher Stadt sammelst du?</h1>
        <Suchfeld
          value={query}
          onChange={setQuery}
          placeholder="Stadt eingeben ..."
          inputRef={inputRef}
        />
        <Trefferliste
          query={query}
          treffer={matches}
          nameVon={(g) => g.name}
          zusatzVon={(g) =>
            g.typ === "geteilt" && !g.verfuegbar ? (
              <span className="nicht-verfuegbar" title="Noch keine genauen Straßendaten">
                {" "}
                ×
              </span>
            ) : null
          }
          onWaehlen={onWaehlen}
          leerHinweis="z. B. Essen, Bochum oder Marl"
        />
      </div>
    </AppShell>
  );
}

function StrassenAnwendung({
  datei,
  stadt,
  onGemeindeAendern,
}: {
  datei: string;
  stadt: string;
  onGemeindeAendern: () => void;
}) {
  const dataState = useStrassenDaten(datei);

  if (dataState.status === "loading") {
    return <StatusScreen text="Lade Daten ..." stadt={stadt} />;
  }
  if (dataState.status === "error") {
    return (
      <StatusScreen text={`Daten konnten nicht geladen werden: ${dataState.message}`} stadt={stadt} />
    );
  }

  return <Bereit data={dataState.data} onGemeindeAendern={onGemeindeAendern} />;
}

function Bereit({ data, onGemeindeAendern }: { data: StrassenDaten; onGemeindeAendern: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Strasse | null>(null);
  const [hausnummerInput, setHausnummerInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selected]);

  function zurueck() {
    setSelected(null);
    setQuery("");
    setHausnummerInput("");
  }

  const info = [`${data.meta.kommune} · Datenstand ${data.meta.stand}`];

  if (selected) {
    return (
      <AppShell
        untertitel={data.meta.kommune}
        onZurueck={zurueck}
        onStadtAendern={onGemeindeAendern}
        info={info}
      >
        <Ergebnis
          strasse={selected}
          hausnummerInput={hausnummerInput}
          onHausnummerChange={setHausnummerInput}
          onZurueck={zurueck}
          wahlkreisNamen={data.wahlkreise}
          kommune={data.meta.kommune}
          inputRef={inputRef}
        />
      </AppShell>
    );
  }

  const matches = query.trim().length > 0 ? searchStrassen(query, data.strassen) : [];

  return (
    <AppShell
      untertitel={data.meta.kommune}
      onZurueck={onGemeindeAendern}
      onStadtAendern={onGemeindeAendern}
      info={info}
    >
      <div className="seite">
        <h1 className="seiten-titel">Welche Straße?</h1>
        <Suchfeld
          value={query}
          onChange={setQuery}
          placeholder="Straße eingeben ..."
          inputRef={inputRef}
        />
        <Trefferliste
          query={query}
          treffer={matches}
          nameVon={(s) => s.n}
          onWaehlen={setSelected}
          leerHinweis="z. B. Hauptstraße"
        />
      </div>
    </AppShell>
  );
}

/* --- Ergebnis --- */

interface ErgebnisProps {
  strasse: Strasse;
  hausnummerInput: string;
  onHausnummerChange: (value: string) => void;
  onZurueck: () => void;
  wahlkreisNamen: Record<string, string>;
  kommune: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function Ergebnis({
  strasse,
  hausnummerInput,
  onHausnummerChange,
  onZurueck,
  wahlkreisNamen,
  kommune,
  inputRef,
}: ErgebnisProps) {
  const geteilt = "b" in strasse;
  const parsed = hausnummerInput.trim().length > 0 ? parseEingabe(hausnummerInput) : null;
  const ergebnis = ergebnisFuer(strasse, parsed?.nummer ?? null);
  const ort = parsed ? `${strasse.n} ${hausnummerInput.trim()}` : strasse.n;

  return (
    <div className="seite">
      {geteilt && (
        <div className="karte hausnummer-eingabe">
          <label htmlFor="hausnummer">Hausnummer</label>
          <p className="hinweis">Diese Straße ist geteilt – bitte Hausnummer eingeben.</p>
          <input
            id="hausnummer"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={hausnummerInput}
            onChange={(e) => onHausnummerChange(e.target.value)}
            placeholder="Hausnummer"
            autoComplete="off"
            autoFocus
          />
        </div>
      )}

      {ergebnis.art === "eindeutig" || ergebnis.art === "treffer" ? (
        <ErgebnisKarte
          wk={ergebnis.wk}
          name={wahlkreisNamen[ergebnis.wk] ?? ""}
          ort={`${ort} · ${kommune}`}
        />
      ) : ergebnis.art === "vermutung" ? (
        <VermutungAnzeige
          vermutung={ergebnis.vermutung}
          grund={ergebnis.grund}
          name={wahlkreisNamen[ergebnis.vermutung] ?? ""}
          kommune={kommune}
        />
      ) : (
        <BereichsUebersicht
          bereiche={ergebnis.bereiche}
          wahlkreisNamen={wahlkreisNamen}
          keinTreffer={ergebnis.art === "kein-treffer"}
          onBereichWaehlen={(b) => onHausnummerChange(String(b.von))}
        />
      )}

      <PillButton onClick={onZurueck}>Andere Straße suchen</PillButton>
    </div>
  );
}

function ErgebnisKarte({ wk, name, ort }: { wk: string; name: string; ort: string }) {
  return (
    <div className="ergebnis-karte" aria-live="polite">
      <span className="ergebnis-label">Landtagswahlkreis</span>
      <span className="zahl">{wk}</span>
      {name && <span className="wk-name">{name}</span>}
      <span className="ort">{ort}</span>
    </div>
  );
}

function VermutungAnzeige({
  vermutung,
  grund,
  name,
  kommune,
}: {
  vermutung: string;
  grund: string;
  name: string;
  kommune: string;
}) {
  return (
    <div className="karte warn-karte">
      <p className="warnung">
        Diese Adresse ist im amtlichen Straßenverzeichnis ohne Wahlkreis eingetragen. Die
        Nachbaradressen liegen in Wahlkreis {vermutung}. Vor dem Sammeln beim Wahlamt der Stadt{" "}
        {kommune} prüfen.
      </p>
      <p className="vermutung-klein">
        Vermutlich {vermutung}
        {name ? ` – ${name}` : ""}?
      </p>
      <p className="grund">{grund}</p>
    </div>
  );
}

function BereichsUebersicht({
  bereiche,
  wahlkreisNamen,
  keinTreffer,
  onBereichWaehlen,
}: {
  bereiche: Bereich[];
  wahlkreisNamen: Record<string, string>;
  keinTreffer: boolean;
  onBereichWaehlen: (bereich: Bereich) => void;
}) {
  return (
    <div className="uebersicht">
      {keinTreffer && (
        <div className="karte hinweis-karte">
          Diese Hausnummer ist im amtlichen Verzeichnis nicht geführt.
        </div>
      )}
      <p className="abschnitt-titel">Hausnummernbereiche</p>
      <ul className="bereichsliste">
        {bereiche.map((b) => (
          <li key={`${b.von}-${b.bis}-${b.par}`}>
            <button type="button" className="bereich-eintrag karte" onClick={() => onBereichWaehlen(b)}>
              <span className="bereich-zahlen">
                {b.von === b.bis ? b.von : `${b.von}–${b.bis}`}
              </span>
              <span className="bereich-wk">
                <span className={b.wk ? "wk-badge" : "wk-badge unklar"}>
                  {b.wk ? `WK ${b.wk}` : "unklar"}
                </span>
                {b.wk && wahlkreisNamen[b.wk] && (
                  <span className="bereich-wk-name">{wahlkreisNamen[b.wk]}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --- Kleinteile --- */

function PillButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="pill-button" onClick={onClick}>
      {children}
    </button>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconMenu() {
  return (
    <Icon>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

function IconX() {
  return (
    <Icon>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

function IconPfeilLinks() {
  return (
    <Icon>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
  );
}

function IconPfeilRechts() {
  return (
    <Icon>
      <path d="M9 5l7 7-7 7" />
    </Icon>
  );
}

function IconLupe() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  );
}
