import { describe, expect, it } from "vitest";

import type { PaperSummary } from "@/components/papers/paper-browser";

import {
  activeFilterCount,
  EMPTY_CRITERIA,
  filterPapers,
  groupByYear,
} from "./papers-filter";

const paper = (over: Partial<PaperSummary> = {}): PaperSummary => ({
  slug: "p",
  url: "/papers/p",
  title: "Learning to Optimize Joins",
  year: 2025,
  venue: { name: "VLDB", short: "VLDB", type: "conference" },
  status: "published",
  authors: [{ name: "Maryam Ramezani", url: "/people/maryam-ramezani" }],
  memberIds: ["maryam-ramezani"],
  tags: ["Query Optimization"],
  areas: [{ slug: "ml-for-systems", title: "ML for Systems" }],
  links: [],
  ...over,
});

describe("filterPapers", () => {
  const papers = [
    paper(),
    paper({
      slug: "q",
      title: "Fake News Detection",
      year: 2023,
      venue: { name: "Information Sciences", type: "journal" },
      memberIds: ["ali"],
      authors: [{ name: "Ali Student" }],
      tags: ["Misinformation"],
      areas: [{ slug: "trustworthy-ai", title: "Trustworthy AI" }],
    }),
  ];

  it("returns everything with no criteria", () => {
    expect(filterPapers(papers, EMPTY_CRITERIA)).toHaveLength(2);
  });

  it("filters by year, author, topic, area and venue type", () => {
    const only = (over: Partial<typeof EMPTY_CRITERIA>) =>
      filterPapers(papers, { ...EMPTY_CRITERIA, ...over }).map((p) => p.slug);

    expect(only({ year: "2023" })).toEqual(["q"]);
    expect(only({ member: "ali" })).toEqual(["q"]);
    expect(only({ tag: "Query Optimization" })).toEqual(["p"]);
    expect(only({ area: "trustworthy-ai" })).toEqual(["q"]);
    expect(only({ venueType: "journal" })).toEqual(["q"]);
  });

  it("combines criteria with AND", () => {
    expect(
      filterPapers(papers, {
        ...EMPTY_CRITERIA,
        year: "2023",
        tag: "Query Optimization",
      }),
    ).toEqual([]);
  });

  it("matches free text against title, author, venue and tags, ignoring case", () => {
    const hits = (query: string) =>
      filterPapers(papers, { ...EMPTY_CRITERIA, query }).map((p) => p.slug);

    expect(hits("joins")).toEqual(["p"]);
    expect(hits("ali student")).toEqual(["q"]);
    expect(hits("vldb")).toEqual(["p"]);
    expect(hits("misinformation")).toEqual(["q"]);
    expect(hits("  ")).toEqual(["p", "q"]);
    expect(hits("nothing here")).toEqual([]);
  });
});

describe("activeFilterCount", () => {
  it("counts a non-empty query and every non-default select", () => {
    expect(activeFilterCount(EMPTY_CRITERIA)).toBe(0);
    expect(activeFilterCount({ ...EMPTY_CRITERIA, query: "  " })).toBe(0);
    expect(
      activeFilterCount({ ...EMPTY_CRITERIA, query: "sql", year: "2025" }),
    ).toBe(2);
  });
});

describe("groupByYear", () => {
  it("groups newest year first and keeps the incoming order inside a year", () => {
    const groups = groupByYear([
      paper({ slug: "a", year: 2023 }),
      paper({ slug: "b", year: 2025 }),
      paper({ slug: "c", year: 2023 }),
    ]);
    expect(
      groups.map(([year, items]) => [year, items.map((p) => p.slug)]),
    ).toEqual([
      [2025, ["b"]],
      [2023, ["a", "c"]],
    ]);
  });
});
