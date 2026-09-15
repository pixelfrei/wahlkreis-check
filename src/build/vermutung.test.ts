import { describe, expect, it } from "vitest";
import type { Bereich } from "../shared/types.js";
import { computeVermutung } from "./vermutung.js";

describe("computeVermutung", () => {
  it("bildet eine Vermutung, wenn Nachbarbereiche derselben Seite gleichen Wahlkreis tragen", () => {
    const bereiche: Bereich[] = [
      { von: 3, bis: 177, par: "u", wk: "111" },
      { von: 181, bis: 187, par: "u", wk: "111" },
    ];
    const result = computeVermutung(bereiche, { von: 179, bis: 179, par: "u" });
    expect(result).toEqual({
      wk: "111",
      grund: "Nachbarbereiche 3-177 und 181-187 in 111",
    });
  });

  it("bildet keine Vermutung bei unterschiedlichen Nachbar-Wahlkreisen", () => {
    const bereiche: Bereich[] = [
      { von: 3, bis: 177, par: "u", wk: "111" },
      { von: 181, bis: 187, par: "u", wk: "112" },
    ];
    const result = computeVermutung(bereiche, { von: 179, bis: 179, par: "u" });
    expect(result).toBeNull();
  });

  it("bildet keine Vermutung, wenn nur eine Seite existiert", () => {
    const bereiche: Bereich[] = [{ von: 3, bis: 177, par: "u", wk: "111" }];
    const result = computeVermutung(bereiche, { von: 179, bis: 179, par: "u" });
    expect(result).toBeNull();
  });

  it("schließt nie über die Straßenseite hinweg (par muss passen oder 'b' sein)", () => {
    const bereiche: Bereich[] = [
      { von: 2, bis: 178, par: "g", wk: "111" },
      { von: 180, bis: 188, par: "g", wk: "111" },
    ];
    const result = computeVermutung(bereiche, { von: 179, bis: 179, par: "u" });
    expect(result).toBeNull();
  });
});
