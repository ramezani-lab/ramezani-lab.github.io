import { courseSlug } from "./content/courses";
import { ROLE_LABELS } from "./content/people";
import type { ContentGraph } from "./content/schema";
import type { SearchDoc } from "./search";

/** Reduces MDX source to searchable words: no markup, code, or math. */
export function mdxToPlainText(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/^(import|export) .*$/gm, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ")
    .replace(/[#*_`>~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const POSITION_LEVELS = {
  phd: "PhD",
  msc: "MSc",
  bsc: "Undergraduate",
  intern: "Internship",
  postdoc: "Postdoc",
} as const;

/**
 * Flattens the content graph into search documents. Each document carries the
 * names of its neighbours (`related`), so searching an author finds their
 * papers and searching a paper title surfaces the people who wrote it.
 */
export function collectSearchDocs(graph: ContentGraph): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const area of graph.areas) {
    docs.push({
      id: `research:${area.slug}`,
      kind: "research",
      url: area.url,
      title: area.title,
      description: area.summary,
      related: [
        ...area.people.map((person) => person.name),
        ...area.papers.map((paper) => paper.title),
      ],
      tags: [],
      text: mdxToPlainText(area.body),
    });
  }

  for (const paper of graph.papers) {
    const authors = paper.authors.map((author) =>
      author.kind === "member" ? author.person.name : author.name,
    );
    docs.push({
      id: `paper:${paper.slug}`,
      kind: "paper",
      url: paper.url,
      title: paper.title,
      description: `${paper.venue.short ?? paper.venue.name}, ${paper.year}`,
      related: [
        ...authors,
        paper.venue.name,
        ...(paper.venue.short ? [paper.venue.short] : []),
        ...paper.areas.map((area) => area.title),
      ],
      tags: paper.tags,
      text: `${paper.abstract} ${mdxToPlainText(paper.body)}`.trim(),
    });
  }

  for (const person of graph.people) {
    docs.push({
      id: `person:${person.id}`,
      kind: "person",
      url: person.url,
      title: person.name,
      description: person.title ?? ROLE_LABELS[person.role],
      related: [
        ...person.papers.map((paper) => paper.title),
        ...person.areas.map((area) => area.title),
      ],
      tags: person.interests,
      text: `${person.summary} ${mdxToPlainText(person.body)}`.trim(),
    });
  }

  for (const item of graph.news) {
    docs.push({
      id: `news:${item.slug}`,
      kind: "news",
      url: item.url,
      title: item.title,
      description: item.summary,
      related: [
        ...item.people.map((person) => person.name),
        ...item.papers.map((paper) => paper.title),
      ],
      tags: item.tags,
      text: mdxToPlainText(item.body),
    });
  }

  graph.courses.forEach((course) => {
    const slug = courseSlug(course);
    docs.push({
      id: `course:${slug}`,
      kind: "course",
      url: `/teaching#${slug}`,
      title: course.title,
      description: [course.code, course.level === "graduate" ? "Graduate" : "Undergraduate"]
        .filter(Boolean)
        .join(", "),
      related: course.offerings.map((offering) => offering.term),
      tags: [],
      text: course.description,
    });
  });

  for (const position of graph.positions) {
    docs.push({
      id: `position:${position.slug}`,
      kind: "position",
      url: position.url,
      title: position.title,
      description: position.summary,
      related: [POSITION_LEVELS[position.level]],
      tags: [],
      text: mdxToPlainText(position.body),
    });
  }

  for (const tag of graph.tags) {
    docs.push({
      id: `tag:${tag.slug}`,
      kind: "tag",
      url: tag.url,
      title: tag.name,
      description: `${tag.count} ${tag.count === 1 ? "item" : "items"}`,
      related: [],
      tags: [],
      text: "",
    });
  }

  return docs;
}
