import type { PhotoSummary } from "@/components/gallery/gallery-grid";
import type { PaperSummary } from "@/components/papers/paper-browser";

import { slugify } from "../slug";
import type { GalleryPhoto, Paper } from "./schema";

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

/** Projects a photo into the plain object the client grid receives. */
export function toPhotoSummary(photo: GalleryPhoto): PhotoSummary {
  return {
    id: photo.id,
    caption: photo.caption,
    date: photo.date,
    ...(photo.description ? { description: photo.description } : {}),
    ...(photo.location ? { location: photo.location } : {}),
    width: photo.width,
    height: photo.height,
    full: photo.full,
    renditions: photo.renditions,
    tags: photo.tags.map((name) => ({ name, url: `/tags/${slugify(name)}` })),
    ...(photo.news
      ? { news: { title: photo.news.title, url: photo.news.url } }
      : {}),
  };
}
