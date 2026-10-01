import { describe, expect, it } from "vitest";

import { buildGraph } from "./content/graph";
import { fixture, photo } from "./content/testing";
import { collectSearchDocs } from "./search-docs";

describe("collectSearchDocs", () => {
  const graph = buildGraph(fixture());
  const docs = collectSearchDocs(graph);
  const byId = new Map(docs.map((doc) => [doc.id, doc]));

  it("indexes every entity in the graph once", () => {
    expect(byId.size).toBe(docs.length);
    expect(docs.filter((d) => d.kind === "person")).toHaveLength(
      graph.people.length,
    );
    expect(docs.filter((d) => d.kind === "paper")).toHaveLength(
      graph.papers.length,
    );
    expect(docs.filter((d) => d.kind === "news")).toHaveLength(
      graph.news.length,
    );
    expect(docs.filter((d) => d.kind === "research")).toHaveLength(
      graph.areas.length,
    );
    expect(docs.filter((d) => d.kind === "position")).toHaveLength(
      graph.positions.length,
    );
    expect(docs.filter((d) => d.kind === "tag")).toHaveLength(
      graph.tags.length,
    );
  });

  it("carries graph neighbours as related labels", () => {
    const paper = byId.get("paper:p1")!;
    expect(paper.related).toEqual(
      expect.arrayContaining([
        "Ali Student",
        "External Person",
        "Maryam Ramezani",
        "VLDB",
      ]),
    );
    expect(byId.get("person:ali")!.related).toEqual(
      expect.arrayContaining(["P1", "Text-to-SQL"]),
    );
  });

  it("strips MDX syntax from indexed body text", () => {
    const graphWithBody = buildGraph(
      fixture({
        positions: [],
        news: [],
        research: [],
        papers: [],
      }),
    );
    const person = graphWithBody.peopleById.get("ali")!;
    (person as { body: string }).body =
      '## Bio\n<Callout type="tip">Hi **there**</Callout>';
    const doc = collectSearchDocs(graphWithBody).find(
      (d) => d.id === "person:ali",
    )!;
    expect(doc.text).toBe("Bio Hi there");
  });

  it("indexes each gallery photo under its caption", () => {
    const docs = collectSearchDocs(
      buildGraph(
        fixture({
          photos: [
            photo("retreat.jpg", {
              caption: "The lab at the spring retreat",
              date: "2026-02-01",
              location: "Tehran",
              description: "Twelve of us on the steps.",
              tags: ["LLMs"],
              news: "n1",
            }),
          ],
        }),
      ),
    );

    const doc = docs.find((entry) => entry.id === "photo:retreat");
    expect(doc).toMatchObject({
      kind: "photo",
      url: "/gallery#retreat",
      title: "The lab at the spring retreat",
      tags: ["LLMs"],
      text: "Twelve of us on the steps.",
    });
    expect(doc?.description).toContain("Tehran");
    expect(doc?.related).toEqual(["N1"]);
  });
});
