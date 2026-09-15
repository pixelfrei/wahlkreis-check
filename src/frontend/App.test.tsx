// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";
import type { GemeindeIndex, StrassenDaten } from "../shared/types.js";

const GEMEINDE_INDEX: GemeindeIndex = {
  meta: { stand: "2026-09-13", quelle: "test" },
  gemeinden: [
    { name: "Dortmund", typ: "geteilt", verfuegbar: true, datei: "dortmund.json" },
    { name: "Kleinstadt", typ: "einfach", wk: "999" },
    { name: "Großstadt Ohne Daten", typ: "geteilt", verfuegbar: false },
  ],
};

const DORTMUND: StrassenDaten = {
  meta: {
    kommune: "Dortmund",
    stand: "2025-09-14",
    gebaut_am: "2026-09-13",
    quellen: [],
    zuordnung: "amtlich",
  },
  wahlkreise: { "111": "Dortmund I", "112": "Dortmund II" },
  strassen: [
    { n: "ABBOWEG", wk: "111" },
    { n: "HOLBEINWEG", wk: "111", z: [{ nr: 2, von: "a", bis: "a", wk: "112" }] },
    {
      n: "ARDEYSTRAßE",
      b: [
        { von: 2, bis: 64, par: "g", wk: "112" },
        { von: 67, bis: 95, par: "u", wk: "111" },
      ],
    },
  ],
};

beforeEach(() => {
  localStorage.clear();
  // jsdom kann nicht scrollen
  window.scrollTo = vi.fn();
  window.history.replaceState(null, "", "/");
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const daten = url.includes("gemeinden.json") ? GEMEINDE_INDEX : DORTMUND;
      return Promise.resolve({ ok: true, json: () => Promise.resolve(daten) } as Response);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

async function waehleDortmund(user: UserEvent) {
  const suchfeld = await screen.findByPlaceholderText("Stadt eingeben ...");
  await user.type(suchfeld, "Dortmund");
  await user.click(await screen.findByRole("button", { name: "Dortmund" }));
}

describe("Stadtauswahl", () => {
  it("springt bei /dortmund direkt zur Straßensuche und setzt beim Wählen die URL", async () => {
    window.history.replaceState(null, "", "/dortmund");
    render(<App />);

    expect(await screen.findByPlaceholderText("Straße eingeben ...")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dortmund");
  });

  it("setzt die URL beim Wählen einer Gemeinde und beim Zurücksetzen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waehleDortmund(user);

    expect(window.location.pathname).toBe("/dortmund");

    await screen.findByPlaceholderText("Straße eingeben ...");
    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    await user.click(screen.getByRole("button", { name: "Stadt ändern" }));

    expect(window.location.pathname).toBe("/");
  });

  it("zeigt bei einer einfachen Gemeinde sofort die Wahlkreisnummer", async () => {
    const user = userEvent.setup();
    render(<App />);

    const suchfeld = await screen.findByPlaceholderText("Stadt eingeben ...");
    await user.type(suchfeld, "Kleinstadt");
    await user.click(await screen.findByRole("button", { name: "Kleinstadt" }));

    expect(await screen.findByText("999")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Andere Stadt wählen" })).toBeInTheDocument();
  });

  it("markiert Gemeinden ohne genaue Daten und zeigt einen Hinweis statt Straßensuche", async () => {
    const user = userEvent.setup();
    render(<App />);

    const suchfeld = await screen.findByPlaceholderText("Stadt eingeben ...");
    await user.type(suchfeld, "Großstadt");

    const treffer = await screen.findByRole("button", { name: /Großstadt Ohne Daten/ });
    expect(treffer.textContent).toContain("×");
    await user.click(treffer);

    expect(await screen.findByText(/noch keine genauen Straßendaten/)).toBeInTheDocument();
  });

  it("merkt sich eine verfügbare geteilte Gemeinde und lädt beim nächsten Start direkt die Straßensuche", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await waehleDortmund(user);
    await screen.findByPlaceholderText("Straße eingeben ...");
    unmount();

    render(<App />);
    expect(await screen.findByPlaceholderText("Straße eingeben ...")).toBeInTheDocument();
  });
});

describe("Menü", () => {
  it("öffnet sich über den Hamburger-Button und schließt mit Escape", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByPlaceholderText("Stadt eingeben ...");

    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    expect(screen.getByRole("dialog", { name: "Menü" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Wahlkreis suchen" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Datenquellen" })).toHaveAttribute("href", "/quellen");
    expect(screen.queryByRole("button", { name: "Stadt ändern" })).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Menü" })).not.toBeInTheDocument();
  });
});

describe("Infoseiten", () => {
  it("öffnet eine Infoseite aus dem Menü und kehrt mit erhaltenem Ergebnis zurück", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waehleDortmund(user);
    await user.type(await screen.findByPlaceholderText("Straße eingeben ..."), "abboweg");
    await user.click(await screen.findByRole("button", { name: "ABBOWEG" }));
    await screen.findByText("111");

    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    await user.click(screen.getByRole("link", { name: "Impressum" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Impressum" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/impressum");
    // Die App bleibt im Hintergrund erhalten, ist aber nicht sichtbar.
    expect(screen.getByText("111")).not.toBeVisible();

    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    expect(screen.getByRole("link", { name: "Impressum" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Stadt ändern" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Zurück zur App" }));

    expect(await screen.findByText("111")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dortmund");
  });

  it("wechselt über Links im Inhalt zwischen Infoseiten", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/datenschutz");
    render(<App />);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Datenschutzerklärung" }),
    ).toBeInTheDocument();
    await user.click(screen.getAllByRole("link", { name: "Impressum" })[0]!);

    expect(await screen.findByRole("heading", { level: 1, name: "Impressum" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/impressum");
  });

  it("führt bei direktem Aufruf über den Pfeil zur App", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/quellen.html");
    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: "Datenquellen" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/quellen");

    await user.click(screen.getByRole("button", { name: "Zurück zur App" }));

    expect(await screen.findByPlaceholderText("Stadt eingeben ...")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });
});

describe("Straßensuche (innerhalb einer Gemeinde)", () => {
  it("führt über den Pfeil zurück zur Stadtauswahl", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waehleDortmund(user);
    await screen.findByPlaceholderText("Straße eingeben ...");

    await user.click(screen.getByRole("button", { name: "Zurück" }));

    expect(await screen.findByPlaceholderText("Stadt eingeben ...")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("zeigt bei eindeutiger Straße sofort die Wahlkreisnummer", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waehleDortmund(user);

    const suchfeld = await screen.findByPlaceholderText("Straße eingeben ...");
    await user.type(suchfeld, "abboweg");

    await user.click(await screen.findByRole("button", { name: "ABBOWEG" }));

    expect(await screen.findByText("111")).toBeInTheDocument();
  });

  it("fragt bei geteilter Straße nach der Hausnummer und löst dann auf", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waehleDortmund(user);

    const suchfeld = await screen.findByPlaceholderText("Straße eingeben ...");
    await user.type(suchfeld, "ardey");

    await user.click(await screen.findByRole("button", { name: "ARDEYSTRAßE" }));

    expect(await screen.findByText(/geteilt/)).toBeInTheDocument();

    const hausnummerfeld = await screen.findByPlaceholderText("Hausnummer");
    await user.type(hausnummerfeld, "71");

    expect(await screen.findByText("111")).toBeInTheDocument();
  });

  it("löst per Klick auf einen Bereich in der Übersicht auf", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waehleDortmund(user);

    const suchfeld = await screen.findByPlaceholderText("Straße eingeben ...");
    await user.type(suchfeld, "ardey");
    await user.click(await screen.findByRole("button", { name: "ARDEYSTRAßE" }));

    const bereichEintrag = await screen.findByText(/WK 111/);
    await user.click(bereichEintrag);

    expect(await screen.findByText("111")).toBeInTheDocument();
  });

  it("fragt bei Straßen mit Buchstaben-Ausnahme nach der Hausnummer und wertet den Buchstaben aus", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waehleDortmund(user);

    await user.type(await screen.findByPlaceholderText("Straße eingeben ..."), "holbein");
    await user.click(await screen.findByRole("button", { name: "HOLBEINWEG" }));

    expect(await screen.findByText(/Einzelne Hausnummern mit Buchstaben/)).toBeInTheDocument();
    expect(screen.getByText("Alle anderen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^2a/ })).toBeInTheDocument();

    const feld = screen.getByPlaceholderText("Hausnummer");
    await user.type(feld, "2");
    expect(await screen.findByText("111")).toBeInTheDocument();

    await user.type(feld, "a");
    expect(await screen.findByText("112")).toBeInTheDocument();
  });

  it("springt über Zurück zur leeren Suche", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waehleDortmund(user);

    const suchfeld = await screen.findByPlaceholderText("Straße eingeben ...");
    await user.type(suchfeld, "abboweg");
    await user.click(await screen.findByRole("button", { name: "ABBOWEG" }));
    await screen.findByText("111");

    await user.click(screen.getByRole("button", { name: "Zurück" }));

    expect(await screen.findByPlaceholderText("Straße eingeben ...")).toHaveValue("");
  });

  it("springt über Stadt ändern zurück zur Stadtsuche", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waehleDortmund(user);

    await screen.findByPlaceholderText("Straße eingeben ...");
    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    await user.click(screen.getByRole("button", { name: "Stadt ändern" }));

    expect(await screen.findByPlaceholderText("Stadt eingeben ...")).toBeInTheDocument();
  });
});
