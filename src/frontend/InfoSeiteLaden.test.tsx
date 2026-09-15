// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";
import type { GemeindeIndex } from "../shared/types.js";

const laden = vi.hoisted(() => ({
  ladeInfoseite: vi.fn<(seite: string) => Promise<string>>(),
  nachDeployNeuLaden: vi.fn(() => false),
  seiteNeuLaden: vi.fn(),
}));

vi.mock("./seiten/laden.js", () => ({
  geladenerInhalt: () => undefined,
  infoseitenVorladen: () => () => {},
  ladeInfoseite: laden.ladeInfoseite,
  nachDeployNeuLaden: laden.nachDeployNeuLaden,
  seiteNeuLaden: laden.seiteNeuLaden,
}));

const GEMEINDE_INDEX: GemeindeIndex = { meta: { stand: "2026-09-13", quelle: "test" }, gemeinden: [] };

beforeEach(() => {
  window.scrollTo = vi.fn();
  window.history.replaceState(null, "", "/impressum");
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(GEMEINDE_INDEX) } as Response)),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  laden.ladeInfoseite.mockReset();
});

describe("Infoseite nachladen", () => {
  it("zeigt bei einem Ladefehler einen Hinweis und lädt neu - per Knopf oder wenn das Netz zurück ist", async () => {
    const user = userEvent.setup();
    laden.ladeInfoseite.mockRejectedValueOnce(new Error("offline"));

    render(<App />);

    expect(await screen.findByText(/konnte nicht geladen werden/)).toBeInTheDocument();
    expect(laden.nachDeployNeuLaden).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Jetzt neu laden" }));
    expect(laden.seiteNeuLaden).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("online"));
    expect(laden.seiteNeuLaden).toHaveBeenCalledTimes(2);
  });
});
