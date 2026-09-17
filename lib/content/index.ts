import { getGraph } from "./graph";
import { groupPeople } from "./people";
import type {
  Course,
  NewsItem,
  Paper,
  Person,
  Position,
  ResearchArea,
  Tag,
} from "./schema";

export { buildGraph, getGraph } from "./graph";
export { DEGREE_LABELS, groupPeople, ROLE_GROUPS, ROLE_LABELS } from "./people";
export * from "./schema";

export function getAllPeople(): Person[] {
  return getGraph().people;
}

export function getPerson(id: string): Person | undefined {
  return getGraph().peopleById.get(id);
}

export function getDirector(): Person {
  return getGraph().director;
}

export function getPeopleGroups() {
  return groupPeople(getGraph().people);
}

/** Current members (everyone but alumni), in people-page order. */
export function getCurrentMembers(): Person[] {
  return getPeopleGroups()
    .filter((group) => group.role !== "alumni")
    .flatMap((group) => group.people);
}

export function getAllPapers(): Paper[] {
  return getGraph().papers;
}

export function getPaper(slug: string): Paper | undefined {
  return getGraph().papersBySlug.get(slug);
}

/** Papers flagged `featured`, falling back to the newest when none are. */
export function getFeaturedPapers(limit = 3): Paper[] {
  const papers = getGraph().papers;
  const featured = papers.filter((paper) => paper.featured);
  return (featured.length > 0 ? featured : papers).slice(0, limit);
}

/**
 * Papers sharing the most research areas and tags with the given one.
 * Areas weigh double: they are curated, tags are free-form.
 */
export function getRelatedPapers(paper: Paper, limit = 3): Paper[] {
  const areas = new Set(paper.areas.map((area) => area.slug));
  const tags = new Set(paper.tags);

  return getGraph()
    .papers.filter((candidate) => candidate.slug !== paper.slug)
    .map((candidate) => ({
      candidate,
      score:
        2 * candidate.areas.filter((area) => areas.has(area.slug)).length +
        candidate.tags.filter((tag) => tags.has(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.candidate.year - a.candidate.year)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function getAllNews(): NewsItem[] {
  return getGraph().news;
}

export function getNewsItem(slug: string): NewsItem | undefined {
  return getGraph().newsBySlug.get(slug);
}

export function getAllAreas(): ResearchArea[] {
  return getGraph().areas;
}

export function getArea(slug: string): ResearchArea | undefined {
  return getGraph().areasBySlug.get(slug);
}

export function getAllPositions(): Position[] {
  return getGraph().positions;
}

export function getOpenPositions(): Position[] {
  return getGraph().positions.filter((position) => position.status === "open");
}

export function getCourses(): Course[] {
  return getGraph().courses;
}

export function getAllTags(): Tag[] {
  return getGraph().tags;
}

export function getTag(slug: string): Tag | undefined {
  return getGraph().tagsBySlug.get(slug);
}

export interface SiteStats {
  papers: number;
  members: number;
  alumni: number;
  areas: number;
}

/** Site-wide counts, computed once at build time. */
export function getStats(): SiteStats {
  const graph = getGraph();
  const alumni = graph.people.filter((person) => person.role === "alumni").length;
  return {
    papers: graph.papers.length,
    members: graph.people.length - alumni,
    alumni,
    areas: graph.areas.length,
  };
}
