// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AktualisierungsHinweis } from "./App.js";

afterEach(cleanup);

describe("AktualisierungsHinweis", () => {
  it("fragt, statt stillschweigend zu wechseln", async () => {
    const user = userEvent.setup();
    const onUebernehmen = vi.fn();
    const onSchliessen = vi.fn();
    render(<AktualisierungsHinweis onUebernehmen={onUebernehmen} onSchliessen={onSchliessen} />);

    expect(screen.getByRole("status")).toHaveTextContent("Neue Daten verfügbar.");

    await user.click(screen.getByRole("button", { name: "Jetzt aktualisieren" }));
    expect(onUebernehmen).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Hinweis schließen" }));
    expect(onSchliessen).toHaveBeenCalled();
  });
});
