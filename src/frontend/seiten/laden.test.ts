// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { geladenerInhalt, ladeInfoseite, nachDeployNeuLaden } from "./laden.js";

describe("ladeInfoseite", () => {
  it("lädt den Inhalt nach und merkt ihn sich", async () => {
    expect(geladenerInhalt("impressum")).toBeUndefined();

    const html = await ladeInfoseite("impressum");

    expect(html).toContain("<h1>Impressum</h1>");
    expect(geladenerInhalt("impressum")).toBe(html);
    expect(ladeInfoseite("impressum")).toBe(ladeInfoseite("impressum"));
  });
});

describe("nachDeployNeuLaden", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("lädt einmal neu, aber nicht sofort ein zweites Mal", () => {
    const neuLaden = vi.fn();

    expect(nachDeployNeuLaden(neuLaden)).toBe(true);
    expect(nachDeployNeuLaden(neuLaden)).toBe(false);
    expect(neuLaden).toHaveBeenCalledTimes(1);
  });

  it("lädt ohne Internetverbindung nicht neu", () => {
    vi.stubGlobal("navigator", { ...navigator, onLine: false });
    const neuLaden = vi.fn();

    expect(nachDeployNeuLaden(neuLaden)).toBe(false);
    expect(neuLaden).not.toHaveBeenCalled();
  });
});
