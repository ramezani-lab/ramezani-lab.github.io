import { describe, expect, it } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Text-to-SQL & LLMs")).toBe("text-to-sql-llms");
    expect(slugify("  Graph   Mining ")).toBe("graph-mining");
  });

  it("folds accents and drops symbols", () => {
    expect(slugify("Réseaux (Complexes)")).toBe("reseaux-complexes");
  });

  it("never returns an empty slug", () => {
    expect(slugify("???")).toBe("item");
  });
});
