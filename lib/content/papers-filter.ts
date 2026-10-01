import type { PaperSummary } from "@/components/papers/paper-browser";

/**
 * One value per filter group. "all" means the group is not filtering; the
 * publications rail is single-select, so a criteria object is a plain record.
 */
export interface PaperCriteria {
  query: string;
  year: string;
  member: string;
  tag: string;
  area: string;
  venueType: string;
}

export const EMPTY_CRITERIA: PaperCriteria = {
  query: "",
  year: "all",
  member: "all",
  tag: "all",
  area: "all",
  venueType: "all",
};

/** How many groups are narrowing the list, for the mobile "Filters" button. */
export function activeFilterCount(criteria: PaperCriteria): number {
  const selects = [
    criteria.year,
    criteria.member,
    criteria.tag,
    criteria.area,
    criteria.venueType,
  ];
  return (
    (criteria.query.trim() === "" ? 0 : 1) +
    selects.filter((value) => value !== "all").length
  );
}

/** Title, authors, venue and tags — everything the row displays. */
function haystack(paper: PaperSummary): string {
  return [
    paper.title,
    paper.venue.name,
    paper.venue.short ?? "",
    ...paper.authors.map((author) => author.name),
    ...paper.tags,
  ]
    .join(" ")
    .toLowerCase();
}

export function filterPapers(
  papers: PaperSummary[],
  criteria: PaperCriteria,
): PaperSummary[] {
  const needle = criteria.query.trim().toLowerCase();
  return papers.filter((paper) => {
    if (criteria.year !== "all" && String(paper.year) !== criteria.year) {
      return false;
    }
    if (
      criteria.member !== "all" &&
      !paper.memberIds.includes(criteria.member)
    ) {
      return false;
    }
    if (criteria.tag !== "all" && !paper.tags.includes(criteria.tag)) {
      return false;
    }
    if (
      criteria.area !== "all" &&
      !paper.areas.some((area) => area.slug === criteria.area)
    ) {
      return false;
    }
    if (
      criteria.venueType !== "all" &&
      paper.venue.type !== criteria.venueType
    ) {
      return false;
    }
    return needle === "" || haystack(paper).includes(needle);
  });
}

/** Newest year first; the order inside a year is the caller's. */
export function groupByYear(
  papers: PaperSummary[],
): Array<[number, PaperSummary[]]> {
  const byYear = new Map<number, PaperSummary[]>();
  for (const paper of papers) {
    byYear.set(paper.year, [...(byYear.get(paper.year) ?? []), paper]);
  }
  return [...byYear.entries()].sort((a, b) => b[0] - a[0]);
}
