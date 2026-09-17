import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import matter from "gray-matter";

import { COURSES } from "@/content/data/courses";

import {
  courseSchema,
  newsFrontmatterSchema,
  paperFrontmatterSchema,
  personFrontmatterSchema,
  positionFrontmatterSchema,
  researchFrontmatterSchema,
  type Course,
  type NewsFrontmatter,
  type PaperFrontmatter,
  type PersonFrontmatter,
  type PositionFrontmatter,
  type ResearchFrontmatter,
} from "./schema";

export const CONTENT_DIR = join(process.cwd(), "content");

export interface RawDoc<T> {
  slug: string;
  /** Path relative to the repository root, for error messages. */
  file: string;
  frontmatter: T;
  body: string;
}

export interface RawContent {
  people: RawDoc<PersonFrontmatter>[];
  papers: RawDoc<PaperFrontmatter>[];
  news: RawDoc<NewsFrontmatter>[];
  research: RawDoc<ResearchFrontmatter>[];
  positions: RawDoc<PositionFrontmatter>[];
  courses: Course[];
}

function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(
      (name) =>
        !name.startsWith(".") &&
        !name.startsWith("_") &&
        statSync(join(dir, name)).isDirectory(),
    )
    .sort();
}

/** Formats Zod issues as `field: message` lines. */
function describeError(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown }).issues)
  ) {
    return (
      error as { issues: Array<{ path: PropertyKey[]; message: string }> }
    ).issues
      .map(
        (issue) =>
          `  ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`,
      )
      .join("\n");
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Reads every `<collection>/<slug>/index.mdx`, validating frontmatter and
 * failing the build with a message that names the file and field.
 */
function readCollection<T>(
  root: string,
  collection: string,
  parse: (data: unknown) => T,
): RawDoc<T>[] {
  const dir = join(root, collection);
  const docs: RawDoc<T>[] = [];

  for (const slug of listDirs(dir)) {
    const path = join(dir, slug, "index.mdx");
    if (!existsSync(path)) continue;

    const file = relative(process.cwd(), path);
    const parsed = matter(readFileSync(path, "utf8"));
    try {
      docs.push({
        slug,
        file,
        frontmatter: parse(parsed.data),
        body: parsed.content,
      });
    } catch (error) {
      throw new Error(
        `invalid frontmatter in ${file}:\n${describeError(error)}`,
      );
    }
  }
  return docs;
}

export function readContent(root: string = CONTENT_DIR): RawContent {
  return {
    people: readCollection(root, "people", (d) =>
      personFrontmatterSchema.parse(d),
    ),
    papers: readCollection(root, "papers", (d) =>
      paperFrontmatterSchema.parse(d),
    ),
    news: readCollection(root, "news", (d) => newsFrontmatterSchema.parse(d)),
    research: readCollection(root, "research", (d) =>
      researchFrontmatterSchema.parse(d),
    ),
    positions: readCollection(root, "positions", (d) =>
      positionFrontmatterSchema.parse(d),
    ),
    courses: COURSES.map((course, index) => {
      try {
        return courseSchema.parse(course);
      } catch (error) {
        throw new Error(
          `invalid course #${index + 1} in content/data/courses.ts:\n${describeError(error)}`,
        );
      }
    }),
  };
}
