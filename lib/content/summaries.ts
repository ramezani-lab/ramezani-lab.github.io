import type { PaperSummary } from "@/components/papers/paper-browser";

import type { Paper } from "./schema";

/**
 * Projects a paper into the plain object the client filter receives.
 *
 * Graph objects reference each other in cycles, so they cannot cross the
 * server/client boundary; this keeps exactly the fields the list renders.
 */
export function toPaperSummary(paper: Paper): PaperSummary {
  return {
    slug: paper.slug,
    url: paper.url,
    title: paper.title,
    year: paper.year,
    venue: {
      name: paper.venue.name,
      ...(paper.venue.short ? { short: paper.venue.short } : {}),
      type: paper.venue.type,
    },
    status: paper.status,
    authors: paper.authors.map((author) =>
      author.kind === "member"
        ? { name: author.person.name, url: author.person.url }
        : { name: author.name },
    ),
    memberIds: paper.members.map((member) => member.id),
    tags: paper.tags,
    areas: paper.areas.map((area) => ({ slug: area.slug, title: area.title })),
    links: paper.links,
  };
}
