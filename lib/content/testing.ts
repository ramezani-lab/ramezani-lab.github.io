/**
 * In-memory content for unit tests of the graph and everything built on it.
 * Not imported by application code.
 */
import type { RawContent } from "./read";
import {
  newsFrontmatterSchema,
  paperFrontmatterSchema,
  personFrontmatterSchema,
  positionFrontmatterSchema,
  researchFrontmatterSchema,
} from "./schema";

export const doc = <T>(slug: string, frontmatter: T, body = "") => ({
  slug,
  file: `content/x/${slug}/index.mdx`,
  frontmatter,
  body,
});

export const person = (id: string, name: string, role: string, extra = {}) =>
  doc(id, personFrontmatterSchema.parse({ name, role, ...extra }));

export const paper = (slug: string, extra: Record<string, unknown>) =>
  doc(
    slug,
    paperFrontmatterSchema.parse({
      title: slug.toUpperCase(),
      abstract: "abstract",
      authors: ["ramezani"],
      year: 2024,
      venue: { name: "Venue", type: "journal" },
      ...extra,
    }),
  );

export function fixture(over: Partial<RawContent> = {}): RawContent {
  return {
    people: [
      person("ramezani", "Maryam Ramezani", "director", { image: "./photo.jpg" }),
      person("ali", "Ali Student", "phd"),
    ],
    research: [
      doc(
        "text-to-sql",
        researchFrontmatterSchema.parse({
          title: "Text-to-SQL",
          summary: "s",
          people: ["ali"],
        }),
      ),
    ],
    papers: [
      paper("p1", {
        authors: ["ali", "External Person", "ramezani"],
        year: 2025,
        venue: { name: "VLDB", type: "conference" },
        tags: ["Text-to-SQL", "LLMs"],
        areas: ["text-to-sql"],
        cover: "./cover.png",
      }),
      paper("p2", { year: 2023, tags: ["LLMs"] }),
    ],
    news: [
      doc(
        "n1",
        newsFrontmatterSchema.parse({
          title: "N1",
          date: "2025-05-01",
          category: "paper",
          people: ["ali"],
          papers: ["p1"],
          tags: ["LLMs"],
        }),
      ),
    ],
    positions: [
      doc("phd", positionFrontmatterSchema.parse({ title: "PhD", level: "phd" })),
    ],
    courses: [],
    ...over,
  };
}

