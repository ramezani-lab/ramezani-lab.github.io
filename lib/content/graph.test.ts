import { describe, expect, it } from "vitest";

import { buildGraph } from "./graph";
import { newsFrontmatterSchema, researchFrontmatterSchema } from "./schema";
import { doc, fixture, paper, person, photo } from "./testing";

describe("buildGraph", () => {
  it("resolves member and external authors in order", () => {
    const graph = buildGraph(fixture());
    const p1 = graph.papersBySlug.get("p1")!;
    expect(
      p1.authors.map((author) =>
        author.kind === "member" ? author.person.id : author.name,
      ),
    ).toEqual(["ali", "External Person", "ramezani"]);
    expect(p1.members.map((member) => member.id)).toEqual(["ali", "ramezani"]);
  });

  it("fills inverse relations", () => {
    const graph = buildGraph(fixture());
    expect(graph.peopleById.get("ramezani")!.papers.map((p) => p.slug)).toEqual(
      ["p1", "p2"],
    );
    expect(graph.peopleById.get("ali")!.news.map((n) => n.slug)).toEqual([
      "n1",
    ]);
    expect(graph.peopleById.get("ali")!.areas.map((a) => a.slug)).toEqual([
      "text-to-sql",
    ]);
    expect(
      graph.areasBySlug.get("text-to-sql")!.papers.map((p) => p.slug),
    ).toEqual(["p1"]);
  });

  it("counts tags across papers and news", () => {
    const graph = buildGraph(fixture());
    const llms = graph.tagsBySlug.get("llms")!;
    expect(llms.count).toBe(3);
    expect(llms.name).toBe("LLMs");
    expect(graph.tags[0].slug).toBe("llms");
  });

  it("sorts papers newest first and exposes the director", () => {
    const graph = buildGraph(fixture());
    expect(graph.papers.map((p) => p.slug)).toEqual(["p1", "p2"]);
    expect(graph.director.id).toBe("ramezani");
  });

  it("resolves co-located assets and urls", () => {
    const graph = buildGraph(fixture());
    expect(graph.peopleById.get("ramezani")!.image).toBe(
      "/content/people/ramezani/photo.jpg",
    );
    expect(graph.papersBySlug.get("p1")!.cover).toBe(
      "/content/papers/p1/cover.png",
    );
    expect(graph.papersBySlug.get("p1")!.url).toBe("/papers/p1");
    expect(graph.positions[0].url).toBe("/join#phd");
  });

  it("fails on dangling references with the file named", () => {
    const badNews = fixture({
      news: [
        doc(
          "n2",
          newsFrontmatterSchema.parse({
            title: "N",
            date: "2025-01-01",
            category: "event",
            papers: ["missing"],
          }),
        ),
      ],
    });
    expect(() => buildGraph(badNews)).toThrow(/n2\/index\.mdx[\s\S]*missing/);

    const badArea = fixture({ papers: [paper("p3", { areas: ["nope"] })] });
    expect(() => buildGraph(badArea)).toThrow(/p3\/index\.mdx[\s\S]*nope/);

    const badPerson = fixture({
      research: [
        doc(
          "r",
          researchFrontmatterSchema.parse({
            title: "R",
            summary: "s",
            people: ["ghost"],
          }),
        ),
      ],
    });
    expect(() => buildGraph(badPerson)).toThrow(/r\/index\.mdx[\s\S]*ghost/);
  });

  it("requires exactly one director", () => {
    const none = fixture({
      people: [person("ali", "A", "phd")],
      papers: [],
      news: [],
      research: [],
    });
    expect(() => buildGraph(none)).toThrow(/director/);
  });

  it("generates bibtex from resolved author names unless provided", () => {
    const graph = buildGraph(
      fixture({
        papers: [
          paper("p1", { authors: ["ali", "External Person", "ramezani"] }),
          paper("p2", { bibtex: "@misc{custom}" }),
        ],
        news: [],
      }),
    );
    expect(graph.papersBySlug.get("p1")!.bibtex).toContain(
      "author = {Ali Student and External Person and Maryam Ramezani}",
    );
    expect(graph.papersBySlug.get("p2")!.bibtex).toBe("@misc{custom}");
  });
});

describe("courses", () => {
  it("rejects two courses that resolve to the same anchor", () => {
    const duplicate = {
      title: "Sample course",
      level: "graduate" as const,
      description: "",
      offerings: [],
    };
    expect(() =>
      buildGraph(fixture({ courses: [duplicate, { ...duplicate }] })),
    ).toThrow(/duplicate course/);
  });
});

describe("gallery", () => {
  it("links a photo to its news item and its tags", () => {
    const graph = buildGraph(
      fixture({
        photos: [
          photo("retreat.jpg", {
            news: "n1",
            tags: ["LLMs"],
            date: "2026-02-01",
          }),
        ],
      }),
    );

    expect(graph.photos.map((p) => p.id)).toEqual(["retreat"]);
    expect(graph.photosById.get("retreat")?.url).toBe("/gallery#retreat");
    expect(graph.newsBySlug.get("n1")?.photos.map((p) => p.id)).toEqual([
      "retreat",
    ]);

    const tag = graph.tagsBySlug.get("llms");
    expect(tag?.photos.map((p) => p.id)).toEqual(["retreat"]);
    // two papers, one news item and now one photo
    expect(tag?.count).toBe(4);
  });

  it("fails on a photo that points at a news item that does not exist", () => {
    expect(() =>
      buildGraph(fixture({ photos: [photo("retreat.jpg", { news: "nope" })] })),
    ).toThrow(
      /content\/data\/gallery\.ts[\s\S]*news: no news item with id "nope"/,
    );
  });

  it("leaves news items and tags with empty photo lists when there is no gallery", () => {
    const graph = buildGraph(fixture());
    expect(graph.photos).toEqual([]);
    expect(graph.newsBySlug.get("n1")?.photos).toEqual([]);
    expect(graph.tagsBySlug.get("llms")?.photos).toEqual([]);
  });
});
