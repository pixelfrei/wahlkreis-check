import { describe, expect, it } from "vitest";
import type { GemeindeEintrag } from "../shared/types.js";
import { findeGemeindeAnhandSlug, gemeindeSlug, slugAusPfad } from "./url.js";

describe("slugAusPfad", () => {
  it("liest das erste Pfadsegment", () => {
    expect(slugAusPfad("/dortmund")).toBe("dortmund");
    expect(slugAusPfad("/Dortmund/")).toBe("dortmund");
  });

  it("liefert null für die leere Wurzel", () => {
    expect(slugAusPfad("/")).toBeNull();
    expect(slugAusPfad("")).toBeNull();
  });

  it("nimmt nur das erste Segment bei tieferen Pfaden", () => {
    expect(slugAusPfad("/dortmund/ardeystrasse")).toBe("dortmund");
  });
});

describe("gemeindeSlug / findeGemeindeAnhandSlug", () => {
  const gemeinden: GemeindeEintrag[] = [
    { name: "Dortmund", typ: "geteilt", verfuegbar: true, datei: "dortmund.json" },
    { name: "Bad Münstereifel", typ: "einfach", wk: "8" },
  ];

  it("erzeugt einen umlautfreien Slug", () => {
    expect(gemeindeSlug("Bad Münstereifel")).toBe(gemeindeSlug("badmuenstereifel"));
  });

  it("findet eine Gemeinde anhand ihres Slugs", () => {
    expect(findeGemeindeAnhandSlug(gemeinden, "dortmund")?.name).toBe("Dortmund");
    expect(findeGemeindeAnhandSlug(gemeinden, gemeindeSlug("Bad Münstereifel"))?.name).toBe(
      "Bad Münstereifel",
    );
  });

  it("liefert null ohne Treffer", () => {
    expect(findeGemeindeAnhandSlug(gemeinden, "koeln")).toBeNull();
  });
});
