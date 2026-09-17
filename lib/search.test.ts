import { describe, expect, it } from "vitest";

import {
  createSearchIndex,
  loadSearchIndex,
  querySearchIndex,
  serializeSearchIndex,
  type SearchDoc,
} from "./search";

const docs: SearchDoc[] = [
  {
    id: "paper:dani",
    kind: "paper",
    url: "/papers/dani",
    title: "DANI: Fast Diffusion Aware Network Inference",
    description: "Network inference from information cascades",
    related: ["Maryam Ramezani", "Scientific Reports"],
    tags: ["Graph Mining"],
    text: "",
  },
  {
    id: "person:ramezani",
    kind: "person",
    url: "/people/ramezani",
    title: "Maryam Ramezani",
    description: "Lab Director",
    related: [],
    tags: ["Text-to-SQL"],
    text: "",
  },
  {
    id: "research:text-to-sql",
    kind: "research",
    url: "/research/text-to-sql",
    title: "Text-to-SQL",
    description: "Natural language interfaces to databases",
    related: [],
    tags: [],
    text: "",
  },
];

describe("search", () => {
  const index = createSearchIndex(docs);

  it("matches by prefix", () => {
    expect(querySearchIndex(index, "diffus")[0].id).toBe("paper:dani");
  });

  it("tolerates a typo", () => {
    expect(querySearchIndex(index, "ramzani").map((hit) => hit.id)).toContain(
      "person:ramezani",
    );
  });

  it("finds a paper through its related author", () => {
    expect(querySearchIndex(index, "ramezani").map((hit) => hit.id)).toContain(
      "paper:dani",
    );
  });

  it("ranks title matches above related matches", () => {
    expect(querySearchIndex(index, "ramezani")[0].id).toBe("person:ramezani");
  });

  it("requires every term to match", () => {
    expect(querySearchIndex(index, "ramezani databases")).toEqual([]);
  });

  it("round-trips through JSON", () => {
    const loaded = loadSearchIndex(serializeSearchIndex(index));
    const [hit] = querySearchIndex(loaded, "sql");
    expect(hit.url).toBe("/research/text-to-sql");
    expect(hit.kind).toBe("research");
    expect(hit.title).toBe("Text-to-SQL");
  });

  it("returns nothing for blank queries", () => {
    expect(querySearchIndex(index, "   ")).toEqual([]);
  });
});
