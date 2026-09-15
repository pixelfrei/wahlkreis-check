// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  ladeGespeicherteGemeinde,
  loescheGespeicherteGemeinde,
  speichereGemeinde,
} from "./gemeindeStorage.js";

beforeEach(() => {
  localStorage.clear();
});

describe("gemeindeStorage", () => {
  it("liefert null, wenn nichts gespeichert ist", () => {
    expect(ladeGespeicherteGemeinde()).toBeNull();
  });

  it("speichert und lädt eine Gemeinde", () => {
    speichereGemeinde("Dortmund");
    expect(ladeGespeicherteGemeinde()).toBe("Dortmund");
  });

  it("löscht die gespeicherte Gemeinde", () => {
    speichereGemeinde("Dortmund");
    loescheGespeicherteGemeinde();
    expect(ladeGespeicherteGemeinde()).toBeNull();
  });
});
