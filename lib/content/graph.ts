import { slugify } from "../slug";
import { resolveAsset } from "./assets";
import { courseSlug } from "./courses";
import { buildBibtex } from "./bibtex";
import { readContent, type RawContent, type RawDoc } from "./read";
import type {
  ContentGraph,
  NewsItem,
  Paper,
  PaperAuthor,
  Person,
  Position,
  ResearchArea,
  Tag,
} from "./schema";

/** Throws a build error that names the offending file and field. */
function referenceError(
  doc: RawDoc<unknown>,
  field: string,
  value: string,
  kind: string,
): never {
  throw new Error(
    `broken reference in ${doc.file}:\n  ${field}: no ${kind} with id "${value}"`,
  );
}

/**
 * Resolves raw content into a linked, validated graph.
 *
 * Pure: takes already-parsed documents, so tests build graphs in memory. Every
 * cross-reference (people, papers, research areas) is checked here, and an
 * unknown id fails the build rather than silently dropping a link.
 */
export function buildGraph(raw: RawContent): ContentGraph {
  // ---- People -------------------------------------------------------------
  const peopleById = new Map<string, Person>();
  for (const doc of raw.people) {
    const { image, ...rest } = doc.frontmatter;
    peopleById.set(doc.slug, {
      ...rest,
      id: doc.slug,
      url: `/people/${doc.slug}`,
      image: resolveAsset("people", doc.slug, image),
      body: doc.body,
      papers: [],
      news: [],
      areas: [],
    });
  }

  const directors = [...peopleById.values()].filter(
    (p) => p.role === "director",
  );
  if (directors.length !== 1) {
    throw new Error(
      `content/people must contain exactly one person with role "director" (found ${directors.length})`,
    );
  }

  const personRef = (doc: RawDoc<unknown>, field: string, id: string): Person =>
    peopleById.get(id) ?? referenceError(doc, field, id, "person");

  // ---- Research areas -----------------------------------------------------
  const areasBySlug = new Map<string, ResearchArea>();
  for (const doc of raw.research) {
    const area: ResearchArea = {
      slug: doc.slug,
      url: `/research/${doc.slug}`,
      title: doc.frontmatter.title,
      summary: doc.frontmatter.summary,
      order: doc.frontmatter.order,
      icon: doc.frontmatter.icon,
      people: doc.frontmatter.people.map((id) => personRef(doc, "people", id)),
      papers: [],
      body: doc.body,
    };
    areasBySlug.set(doc.slug, area);
    for (const member of area.people) member.areas.push(area);
  }
  const areas = [...areasBySlug.values()].sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title),
  );

  // ---- Papers -------------------------------------------------------------
  const papersBySlug = new Map<string, Paper>();
  for (const doc of raw.papers) {
    const fm = doc.frontmatter;
    const authors: PaperAuthor[] = fm.authors.map((entry) => {
      const member = peopleById.get(entry);
      return member
        ? { kind: "member", person: member }
        : { kind: "external", name: entry };
    });
    const authorNames = authors.map((author) =>
      author.kind === "member" ? author.person.name : author.name,
    );

    const paper: Paper = {
      slug: doc.slug,
      url: `/papers/${doc.slug}`,
      title: fm.title,
      abstract: fm.abstract,
      cover: resolveAsset("papers", doc.slug, fm.cover),
      authors,
      members: authors.flatMap((author) =>
        author.kind === "member" ? [author.person] : [],
      ),
      year: fm.year,
      date: fm.date,
      venue: fm.venue,
      status: fm.status,
      tags: fm.tags,
      areas: fm.areas.map(
        (slug) =>
          areasBySlug.get(slug) ??
          referenceError(doc, "areas", slug, "research area"),
      ),
      links: fm.links,
      featured: fm.featured,
      bibtex:
        fm.bibtex?.trim() ??
        buildBibtex({
          title: fm.title,
          authors: authorNames,
          year: fm.year,
          venue: fm.venue,
          links: fm.links,
        }),
      body: doc.body,
    };
    papersBySlug.set(doc.slug, paper);
  }

  // Newest first: year, then exact date when both have one, then title.
  const papers = [...papersBySlug.values()].sort(
    (a, b) =>
      b.year - a.year ||
      (b.date ?? "").localeCompare(a.date ?? "") ||
      a.title.localeCompare(b.title),
  );

  for (const paper of papers) {
    for (const member of paper.members) {
      if (!member.papers.includes(paper)) member.papers.push(paper);
    }
    for (const area of paper.areas) area.papers.push(paper);
  }

  // ---- News ---------------------------------------------------------------
  const newsBySlug = new Map<string, NewsItem>();
  for (const doc of raw.news) {
    const fm = doc.frontmatter;
    newsBySlug.set(doc.slug, {
      slug: doc.slug,
      url: `/news/${doc.slug}`,
      title: fm.title,
      date: fm.date,
      category: fm.category,
      summary: fm.summary,
      cover: resolveAsset("news", doc.slug, fm.cover),
      people: fm.people.map((id) => personRef(doc, "people", id)),
      papers: fm.papers.map(
        (slug) =>
          papersBySlug.get(slug) ??
          referenceError(doc, "papers", slug, "paper"),
      ),
      tags: fm.tags,
      body: doc.body,
    });
  }
  const news = [...newsBySlug.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
  );

  // A news item about a paper also concerns that paper's lab authors.
  for (const item of news) {
    const involved = new Set([
      ...item.people,
      ...item.papers.flatMap((p) => p.members),
    ]);
    for (const member of involved) member.news.push(item);
  }

  // ---- Positions ----------------------------------------------------------
  const positions: Position[] = raw.positions
    .map((doc) => ({
      ...doc.frontmatter,
      slug: doc.slug,
      url: `/join#${doc.slug}`,
      body: doc.body,
    }))
    .sort(
      (a, b) =>
        Number(a.status === "closed") - Number(b.status === "closed") ||
        a.order - b.order ||
        a.title.localeCompare(b.title),
    );

  // ---- Courses ------------------------------------------------------------
  // Courses are addressed by anchor on the teaching page, so their slugs have
  // to be unique; a duplicate would also collide in the search index.
  const courseSlugs = new Set<string>();
  for (const course of raw.courses) {
    const slug = courseSlug(course);
    if (courseSlugs.has(slug)) {
      throw new Error(
        `duplicate course in content/data/courses.ts: "${course.code ?? ""} ${course.title}" resolves to the id "${slug}" more than once — give each course a distinct code or title`,
      );
    }
    courseSlugs.add(slug);
  }

  // ---- Tags ---------------------------------------------------------------
  const tagsBySlug = new Map<string, Tag>();
  const tagFor = (name: string): Tag => {
    const slug = slugify(name);
    let tag = tagsBySlug.get(slug);
    if (!tag) {
      tag = {
        name,
        slug,
        url: `/tags/${slug}`,
        papers: [],
        news: [],
        count: 0,
      };
      tagsBySlug.set(slug, tag);
    }
    return tag;
  };
  for (const paper of papers) {
    for (const name of paper.tags) {
      const tag = tagFor(name);
      tag.papers.push(paper);
      tag.count++;
    }
  }
  for (const item of news) {
    for (const name of item.tags) {
      const tag = tagFor(name);
      tag.news.push(item);
      tag.count++;
    }
  }
  const tags = [...tagsBySlug.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );

  const people = [...peopleById.values()];

  return Object.freeze({
    people,
    peopleById,
    director: directors[0],
    papers,
    papersBySlug,
    news,
    newsBySlug,
    areas,
    areasBySlug,
    positions,
    courses: raw.courses,
    tags,
    tagsBySlug,
  });
}

let cached: ContentGraph | null = null;

/** The site's content graph, read from `content/` once per process. */
export function getGraph(): ContentGraph {
  cached ??= buildGraph(readContent());
  return cached;
}
