// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { neueVersionUebernehmen, serviceWorkerAnmelden } from "./pwa.js";

function fakeServiceWorker(registrierung: Record<string, unknown>) {
  const sw = {
    register: vi.fn(() => Promise.resolve(registrierung)),
    getRegistration: vi.fn(() => Promise.resolve(registrierung)),
    controller: {},
    addEventListener: vi.fn(),
  };
  vi.stubGlobal("navigator", { ...navigator, serviceWorker: sw, onLine: true });
  return sw;
}

afterEach(() => vi.unstubAllGlobals());

describe("serviceWorkerAnmelden", () => {
  it("meldet eine bereits wartende Version", async () => {
    const melden = vi.fn();
    const sw = fakeServiceWorker({ waiting: {}, addEventListener: vi.fn() });

    serviceWorkerAnmelden(melden);
    window.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(melden).toHaveBeenCalled());

    expect(sw.register).toHaveBeenCalledWith("/sw.js");
  });

  it("meldet eine neu installierte Version", async () => {
    const melden = vi.fn();
    const neue = { state: "installing", addEventListener: vi.fn() };
    const registrierung = {
      installing: neue,
      addEventListener: vi.fn(),
    };
    fakeServiceWorker(registrierung);

    serviceWorkerAnmelden(melden);
    window.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(registrierung.addEventListener).toHaveBeenCalled());

    // Browser meldet "updatefound", danach wechselt der neue Worker auf "installed".
    // at(-1): der vorherige Test hat einen "load"-Zuhörer hinterlassen, der mitfeuert.
    const aufUpdate = registrierung.addEventListener.mock.calls.at(-1)![1] as () => void;
    aufUpdate();
    const aufStatus = neue.addEventListener.mock.calls.at(-1)![1] as () => void;
    neue.state = "installed";
    aufStatus();

    expect(melden).toHaveBeenCalledTimes(1);
  });

  it("tut nichts, wenn der Browser keine Service Worker kann", () => {
    vi.stubGlobal("navigator", {});
    expect(() => serviceWorkerAnmelden(vi.fn())).not.toThrow();
  });
});

describe("neueVersionUebernehmen", () => {
  it("weist die wartende Version an, zu übernehmen", async () => {
    const postMessage = vi.fn();
    const sw = fakeServiceWorker({ waiting: { postMessage } });

    neueVersionUebernehmen();
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith("version-uebernehmen"));

    // Nach dem Wechsel lädt die App neu
    expect(sw.addEventListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function),
      expect.objectContaining({ once: true }),
    );
  });
});
