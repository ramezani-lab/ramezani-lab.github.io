import { describe, expect, it } from "vitest";

import {
  newsFrontmatterSchema,
  paperFrontmatterSchema,
  personFrontmatterSchema,
  positionFrontmatterSchema,
} from "./schema";

describe("personFrontmatterSchema", () => {
  it("applies defaults", () => {
    const person = personFrontmatterSchema.parse({ name: "A", role: "phd" });
    expect(person.interests).toEqual([]);
    expect(person.socials).toEqual({});
    expect(person.education).toEqual([]);
    expect(person.order).toBe(100);
  });

  it("rejects unknown roles", () => {
    expect(() =>
      personFrontmatterSchema.parse({ name: "A", role: "dean" }),
    ).toThrow();
  });

  it("rejects malformed emails and social urls", () => {
    expect(() =>
      personFrontmatterSchema.parse({ name: "A", role: "phd", email: "nope" }),
    ).toThrow();
    expect(() =>
      personFrontmatterSchema.parse({
        name: "A",
        role: "phd",
        socials: { github: "not a url" },
      }),
    ).toThrow();
  });
});

describe("paperFrontmatterSchema", () => {
  const base = {
    title: "T",
    abstract: "A",
    authors: ["x"],
    year: 2024,
    venue: { name: "V", type: "journal" },
  };

  it("defaults status, tags, links and featured", () => {
    const paper = paperFrontmatterSchema.parse(base);
    expect(paper.status).toBe("published");
    expect(paper.tags).toEqual([]);
    expect(paper.areas).toEqual([]);
    expect(paper.links).toEqual([]);
    expect(paper.featured).toBe(false);
  });

  it("requires at least one author", () => {
    expect(() =>
      paperFrontmatterSchema.parse({ ...base, authors: [] }),
    ).toThrow();
  });

  it("validates link urls and types", () => {
    expect(() =>
      paperFrontmatterSchema.parse({
        ...base,
        links: [{ type: "arxiv", url: "nope" }],
      }),
    ).toThrow();
    expect(() =>
      paperFrontmatterSchema.parse({
        ...base,
        links: [{ type: "tweet", url: "https://x.com" }],
      }),
    ).toThrow();
  });
});

describe("dates", () => {
  it("requires ISO dates", () => {
    expect(() =>
      newsFrontmatterSchema.parse({
        title: "N",
        date: "May 1 2025",
        category: "event",
      }),
    ).toThrow(/ISO/);
    expect(() =>
      positionFrontmatterSchema.parse({
        title: "P",
        level: "phd",
        deadline: "2025/01/01",
      }),
    ).toThrow(/ISO/);
  });

  it("accepts YAML dates parsed as Date objects", () => {
    const news = newsFrontmatterSchema.parse({
      title: "N",
      date: new Date("2025-05-01T00:00:00Z"),
      category: "event",
    });
    expect(news.date).toBe("2025-05-01");
  });
});
