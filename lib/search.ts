import MiniSearch, { type Options } from "minisearch";

/**
 * Site search.
 *
 * The index is built once at build time (`scripts/build-search-index.ts`) and
 * serialized to `public/search-index.json`; the browser only deserializes and
 * queries it. Both sides share the options below, which is what makes a
 * serialized index loadable.
 */

export const SEARCH_KINDS = [
  "research",
  "paper",
  "person",
  "news",
  "course",
  "position",
  "tag",
] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  url: string;
  title: string;
  /** Short line shown under the title in results. */
  description: string;
  /** Names of neighbours in the content graph: authors, venues, areas, papers. */
  related: string[];
  tags: string[];
  /** Long text that should match but is never displayed. */
  text: string;
}

export interface SearchHit {
  id: string;
  kind: SearchKind;
  url: string;
  title: string;
  description: string;
  related: string[];
  score: number;
}

const OPTIONS: Options<SearchDoc> = {
  idField: "id",
  fields: ["title", "description", "related", "tags", "text"],
  storeFields: ["kind", "url", "title", "description", "related"],
  stringifyField: (value) =>
    Array.isArray(value) ? value.join(" \n ") : String(value ?? ""),
  searchOptions: {
    boost: { title: 5, tags: 2, related: 1.5, description: 1.2, text: 1 },
    // Prefix matching makes search-as-you-type work; fuzziness forgives one
    // typo in longer words without flooding short queries with noise.
    prefix: true,
    fuzzy: (term) => (term.length > 4 ? 0.2 : false),
    combineWith: "AND",
  },
};

export function createSearchIndex(docs: SearchDoc[]): MiniSearch<SearchDoc> {
  const index = new MiniSearch<SearchDoc>(OPTIONS);
  index.addAll(docs);
  return index;
}

export function serializeSearchIndex(index: MiniSearch<SearchDoc>): string {
  return JSON.stringify(index);
}

export function loadSearchIndex(json: string): MiniSearch<SearchDoc> {
  return MiniSearch.loadJSON<SearchDoc>(json, OPTIONS);
}

export function querySearchIndex(
  index: MiniSearch<SearchDoc>,
  query: string,
  limit = 30,
): SearchHit[] {
  if (!query.trim()) return [];
  return index
    .search(query)
    .slice(0, limit)
    .map((result) => ({
      id: String(result.id),
      kind: result.kind as SearchKind,
      url: result.url as string,
      title: result.title as string,
      description: result.description as string,
      related: (result.related as string[] | undefined) ?? [],
      score: result.score,
    }));
}
