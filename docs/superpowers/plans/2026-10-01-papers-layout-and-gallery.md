# Publications layout and photo gallery — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `/papers` a sticky right-hand filter rail over a single-column bibliography, and add a `Gallery` section: a flat, date-ordered stream of photographs with captions, dates and optional details, served as build-time WebP derivatives.

**Architecture:** The publications filter logic moves into a pure module and the component is rebuilt as a two-column grid. The gallery follows the existing `content/data/courses.ts` precedent: metadata in one typed array, image files in `content/gallery/images/`, and a `prebuild` script that uses sharp to write WebP renditions plus a manifest of intrinsic sizes into `public/photos/`. `readContent()` merges array and manifest into `RawContent.photos`, `buildGraph` links each photo to its news item and tags, and the page passes plain projections to a client grid with a dialog-based lightbox.

**Tech Stack:** Next.js 16 (App Router, `output: "export"`), React 19, TypeScript strict, Tailwind v4, Base UI dialog, Zod 4, MiniSearch 7, sharp (new devDependency), Vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-01-papers-layout-and-gallery-design.md`

## Global Constraints

- Fully static: `output: "export"`. No API routes, no request-time data, no `next/image` optimization — `images.unoptimized: true` stays.
- English, LTR, formal copy. No uppercase-styled labels (`text-transform: uppercase` is an established anti-pattern on this site); sentence case everywhere.
- Invalid content or a dangling reference **fails the build**, with a message naming the file and the field.
- No invented facts: the gallery ships with an **empty** `GALLERY` array. Never commit placeholder photos, captions, dates or locations.
- Generated image output goes to `public/photos/`, which is gitignored. `public/content/` is wiped on every `sync-assets` run, so nothing generated may live there.
- Node imports in scripts use the `node:` prefix; path roots are derived with `fileURLToPath(new URL("..", import.meta.url))`, matching `scripts/generate-og.ts`.
- Pure logic is unit-tested with Vitest; components are not. `pnpm test`, `pnpm typecheck`, `pnpm lint` must all pass before each commit.
- Commit messages: conventional prefix, and every commit ends with
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Review Focus

1. **A photo file in `content/gallery/images/` with no entry in `gallery.ts`** — it should be ignored silently, not crash the build and not appear in the gallery. (covered in Task 5)
2. **A portrait photo carrying EXIF orientation** — the grid must reserve the rotated aspect ratio, or every tile below it jumps when the image loads. (covered by `orientedSize` in Task 3, used in Task 5)
3. **An image narrower than 800px** — `thumbnailPlan` must never upscale and must still emit one rendition, or the grid gets an empty `srcset`. (covered in Task 3)
4. **A `#id` in the URL that matches no photo, or matches one hidden by the active filters** — the page must open normally instead of rendering an empty lightbox. (covered in Task 8)
5. **A caption containing characters that slugify away** (`"25%"`, `"—"`) — ids stay unique because they come from file names, but two files like `a-b.jpg` and `a_b.jpg` collide; the build must say which two files and what to do. (covered in Task 4)

---

## File structure

| File                                                  | Responsibility                                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `lib/content/papers-filter.ts`                        | Pure filtering/grouping of `PaperSummary[]` (new)                                   |
| `components/papers/paper-filters.tsx`                 | The filter rail: search box, chips, radio lists (new)                               |
| `components/papers/paper-browser.tsx`                 | Two-column layout, filter state, `PaperRow` (rewritten)                             |
| `lib/images.ts`                                       | Which widths to emit, and `srcSet()` (new)                                          |
| `lib/content/schema.ts`                               | `galleryPhotoSchema` + gallery types; `photos` on `NewsItem`, `Tag`, `ContentGraph` |
| `lib/content/gallery.ts`                              | `photoId()`, `resolvePhotos()` — pure merge of array + manifest (new)               |
| `scripts/build-gallery-images.ts`                     | sharp pipeline and manifest writer (new)                                            |
| `content/data/gallery.ts`                             | The photo metadata array (new, empty)                                               |
| `lib/content/read.ts`                                 | Parses `GALLERY`, reads the manifest, fills `RawContent.photos`                     |
| `lib/content/graph.ts`                                | Links photos to news items and tags                                                 |
| `lib/content/index.ts`                                | `getAllPhotos()`, `getPhoto()`                                                      |
| `lib/content/summaries.ts`                            | `toPhotoSummary()`                                                                  |
| `lib/search.ts`, `lib/search-docs.ts`                 | The `photo` search kind and its documents                                           |
| `components/gallery/gallery-grid.tsx`                 | Masonry grid, year/tag chips, hash sync (new)                                       |
| `components/gallery/gallery-lightbox.tsx`             | Dialog detail view with arrow-key paging (new)                                      |
| `app/gallery/page.tsx`                                | The route (new)                                                                     |
| `lib/site.ts`, `components/layout/header.tsx`         | `getNavItems()` hides an empty gallery                                              |
| `app/sitemap.ts`, `scripts/generate-og.ts`            | `/gallery` entry and card                                                           |
| `app/news/[slug]/page.tsx`, `app/tags/[tag]/page.tsx` | Show a photo's linked content                                                       |
| `README.md`                                           | Gallery authoring section                                                           |

---

### Task 1: Pure publications filter logic

**Files:**

- Create: `lib/content/papers-filter.ts`
- Create: `lib/content/papers-filter.test.ts`

**Interfaces:**

- Consumes: `PaperSummary` from `components/papers/paper-browser.tsx` (existing export; `lib/content/summaries.ts` already imports it this way).
- Produces: `PaperCriteria`, `EMPTY_CRITERIA`, `activeFilterCount(criteria)`, `filterPapers(papers, criteria)`, `groupByYear(papers)`.

- [ ] **Step 1: Write the failing test**

Create `lib/content/papers-filter.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { PaperSummary } from "@/components/papers/paper-browser";

import {
  activeFilterCount,
  EMPTY_CRITERIA,
  filterPapers,
  groupByYear,
} from "./papers-filter";

const paper = (over: Partial<PaperSummary> = {}): PaperSummary => ({
  slug: "p",
  url: "/papers/p",
  title: "Learning to Optimize Joins",
  year: 2025,
  venue: { name: "VLDB", short: "VLDB", type: "conference" },
  status: "published",
  authors: [{ name: "Maryam Ramezani", url: "/people/maryam-ramezani" }],
  memberIds: ["maryam-ramezani"],
  tags: ["Query Optimization"],
  areas: [{ slug: "ml-for-systems", title: "ML for Systems" }],
  links: [],
  ...over,
});

describe("filterPapers", () => {
  const papers = [
    paper(),
    paper({
      slug: "q",
      title: "Fake News Detection",
      year: 2023,
      venue: { name: "Information Sciences", type: "journal" },
      memberIds: ["ali"],
      authors: [{ name: "Ali Student" }],
      tags: ["Misinformation"],
      areas: [{ slug: "trustworthy-ai", title: "Trustworthy AI" }],
    }),
  ];

  it("returns everything with no criteria", () => {
    expect(filterPapers(papers, EMPTY_CRITERIA)).toHaveLength(2);
  });

  it("filters by year, author, topic, area and venue type", () => {
    const only = (over: Partial<typeof EMPTY_CRITERIA>) =>
      filterPapers(papers, { ...EMPTY_CRITERIA, ...over }).map((p) => p.slug);

    expect(only({ year: "2023" })).toEqual(["q"]);
    expect(only({ member: "ali" })).toEqual(["q"]);
    expect(only({ tag: "Query Optimization" })).toEqual(["p"]);
    expect(only({ area: "trustworthy-ai" })).toEqual(["q"]);
    expect(only({ venueType: "journal" })).toEqual(["q"]);
  });

  it("combines criteria with AND", () => {
    expect(
      filterPapers(papers, {
        ...EMPTY_CRITERIA,
        year: "2023",
        tag: "Query Optimization",
      }),
    ).toEqual([]);
  });

  it("matches free text against title, author, venue and tags, ignoring case", () => {
    const hits = (query: string) =>
      filterPapers(papers, { ...EMPTY_CRITERIA, query }).map((p) => p.slug);

    expect(hits("joins")).toEqual(["p"]);
    expect(hits("ali student")).toEqual(["q"]);
    expect(hits("vldb")).toEqual(["p"]);
    expect(hits("misinformation")).toEqual(["q"]);
    expect(hits("  ")).toEqual(["p", "q"]);
    expect(hits("nothing here")).toEqual([]);
  });
});

describe("activeFilterCount", () => {
  it("counts a non-empty query and every non-default select", () => {
    expect(activeFilterCount(EMPTY_CRITERIA)).toBe(0);
    expect(activeFilterCount({ ...EMPTY_CRITERIA, query: "  " })).toBe(0);
    expect(
      activeFilterCount({ ...EMPTY_CRITERIA, query: "sql", year: "2025" }),
    ).toBe(2);
  });
});

describe("groupByYear", () => {
  it("groups newest year first and keeps the incoming order inside a year", () => {
    const groups = groupByYear([
      paper({ slug: "a", year: 2023 }),
      paper({ slug: "b", year: 2025 }),
      paper({ slug: "c", year: 2023 }),
    ]);
    expect(
      groups.map(([year, items]) => [year, items.map((p) => p.slug)]),
    ).toEqual([
      [2025, ["b"]],
      [2023, ["a", "c"]],
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run lib/content/papers-filter.test.ts`
Expected: FAIL — `Failed to resolve import "./papers-filter"`.

- [ ] **Step 3: Write the implementation**

Create `lib/content/papers-filter.ts`:

```ts
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
    if (criteria.tag !== "all" && !paper.tags.includes(criteria.tag))
      return false;
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run lib/content/papers-filter.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/content/papers-filter.ts lib/content/papers-filter.test.ts
git commit -m "$(printf 'refactor: extract pure publication filtering\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 2: The publications filter rail

**Files:**

- Create: `components/papers/paper-filters.tsx`
- Modify: `components/papers/paper-browser.tsx` (the whole `PaperBrowser` body and the `Select` helper; keep `PaperSummary`, `FilterOption`, `STATUS_LABELS` and `PaperRow` as they are)
- Modify: `app/papers/page.tsx` (lead copy only if it needs it; the props do not change)

**Interfaces:**

- Consumes: `PaperCriteria`, `EMPTY_CRITERIA`, `activeFilterCount`, `filterPapers`, `groupByYear` from Task 1.
- Produces: `PaperFilters` — `{ criteria, onChange(next: PaperCriteria): void, years: number[], members: FilterOption[], areas: FilterOption[], tags: FilterOption[], total: number, shown: number }`. No other task consumes it.

- [ ] **Step 1: Write the filter rail**

Create `components/papers/paper-filters.tsx`:

```tsx
"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  activeFilterCount,
  EMPTY_CRITERIA,
  type PaperCriteria,
} from "@/lib/content/papers-filter";
import { cn } from "@/lib/utils";

import type { FilterOption } from "./paper-browser";

const VENUE_TYPES: FilterOption[] = [
  { value: "journal", label: "Journal" },
  { value: "conference", label: "Conference" },
  { value: "workshop", label: "Workshop" },
  { value: "preprint", label: "Preprint" },
  { value: "book", label: "Book chapter" },
];

/** A group heading in the rail. */
function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t py-5 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold tracking-tight text-muted-foreground">
        {label}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** Compact choices that read well in a row: years, venue types. */
function Chips({
  options,
  value,
  onChange,
}: {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[{ value: "all", label: "All" }, ...options].map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors",
            value === option.value
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-input text-muted-foreground hover:border-ring hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Longer lists: one row each, with the current choice marked. */
function Rows({
  options,
  value,
  onChange,
  allLabel,
  limit = 8,
}: {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, limit);

  return (
    <div className="flex flex-col items-start gap-1 text-sm">
      {[{ value: "all", label: allLabel }, ...visible].map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "max-w-full truncate text-start transition-colors",
            value === option.value
              ? "font-medium text-primary-ink"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
      {options.length > limit ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="link-underline pt-1 text-xs text-muted-foreground"
        >
          {expanded ? "Show fewer" : `Show all ${options.length}`}
        </button>
      ) : null}
    </div>
  );
}

/**
 * The publications filter rail.
 *
 * Rendered before the list in the DOM so controls precede content for keyboard
 * and screen-reader users, and placed in the right-hand grid column by the
 * parent. Below `lg` it collapses behind a button.
 */
export function PaperFilters({
  criteria,
  onChange,
  years,
  members,
  areas,
  tags,
}: {
  criteria: PaperCriteria;
  onChange: (criteria: PaperCriteria) => void;
  years: number[];
  members: FilterOption[];
  areas: FilterOption[];
  tags: FilterOption[];
}) {
  const [open, setOpen] = useState(false);
  const active = activeFilterCount(criteria);
  const set = (patch: Partial<PaperCriteria>) =>
    onChange({ ...criteria, ...patch });

  return (
    <aside
      aria-label="Filter publications"
      className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto"
    >
      <div className="flex items-center gap-2 border-b py-4 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <SlidersHorizontal className="size-3.5" />
          Filters{active > 0 ? ` (${active})` : ""}
        </Button>
        {active > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(EMPTY_CRITERIA)}
          >
            <X className="size-3.5" />
            Clear
          </Button>
        ) : null}
      </div>

      <div
        className={cn("pb-8 pt-6 lg:block lg:pt-0", open ? "block" : "hidden")}
      >
        <div className="hidden items-center justify-between lg:flex">
          <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
          {active > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="-me-2"
              onClick={() => onChange(EMPTY_CRITERIA)}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          ) : null}
        </div>

        <div className="mt-4 lg:mt-5">
          <Group label="Search">
            <input
              type="search"
              value={criteria.query}
              onChange={(event) => set({ query: event.target.value })}
              placeholder="Title, author, venue…"
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring"
            />
          </Group>
          <Group label="Year">
            <Chips
              value={criteria.year}
              onChange={(year) => set({ year })}
              options={years.map((year) => ({
                value: String(year),
                label: String(year),
              }))}
            />
          </Group>
          <Group label="Venue">
            <Chips
              value={criteria.venueType}
              onChange={(venueType) => set({ venueType })}
              options={VENUE_TYPES}
            />
          </Group>
          <Group label="Research area">
            <Rows
              value={criteria.area}
              onChange={(area) => set({ area })}
              options={areas}
              allLabel="All areas"
            />
          </Group>
          <Group label="Author">
            <Rows
              value={criteria.member}
              onChange={(member) => set({ member })}
              options={members}
              allLabel="Anyone"
            />
          </Group>
          <Group label="Topic">
            <Rows
              value={criteria.tag}
              onChange={(tag) => set({ tag })}
              options={tags}
              allLabel="All topics"
            />
          </Group>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Rewrite `PaperBrowser` around it**

In `components/papers/paper-browser.tsx`: delete the local `Select` function and the `VENUE_TYPE_OPTIONS` constant (the rail owns venue labels now), keep `PaperSummary`, `FilterOption`, `STATUS_LABELS` and `PaperRow` untouched, and replace the component with:

```tsx
export function PaperBrowser({
  papers,
  members,
  tags,
  areas,
}: {
  papers: PaperSummary[];
  members: FilterOption[];
  tags: FilterOption[];
  areas: FilterOption[];
}) {
  const [criteria, setCriteria] = useState<PaperCriteria>(EMPTY_CRITERIA);

  const years = useMemo(
    () => [...new Set(papers.map((paper) => paper.year))].sort((a, b) => b - a),
    [papers],
  );
  const filtered = useMemo(
    () => filterPapers(papers, criteria),
    [papers, criteria],
  );
  const grouped = useMemo(() => groupByYear(filtered), [filtered]);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-x-12">
      <PaperFilters
        criteria={criteria}
        onChange={setCriteria}
        years={years}
        members={members}
        areas={areas}
        tags={tags}
      />

      <div className="lg:col-start-1 lg:row-start-1">
        <p
          className="border-b py-4 text-sm text-muted-foreground lg:border-t-0"
          aria-live="polite"
        >
          {filtered.length} of {papers.length} publications
        </p>

        {grouped.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No publications match these filters.
          </p>
        ) : null}

        <div className="divide-y">
          {grouped.map(([groupYear, groupPapers]) => (
            <section
              key={groupYear}
              className="grid gap-x-8 py-6 sm:grid-cols-[4.5rem_1fr]"
            >
              <h2 className="pt-6 font-mono text-xl font-medium text-muted-foreground/70">
                {groupYear}
              </h2>
              <ul className="divide-y">
                {groupPapers.map((paper) => (
                  <li key={paper.slug}>
                    <PaperRow paper={paper} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Fix the imports at the top of the file: drop `X` and `Button` if nothing else uses them, and add

```tsx
import { PaperFilters } from "./paper-filters";
import {
  EMPTY_CRITERIA,
  filterPapers,
  groupByYear,
  type PaperCriteria,
} from "@/lib/content/papers-filter";
```

- [ ] **Step 3: Check it compiles and the suite still passes**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all pass. `cn` must still be imported only if used — remove the import if the rewritten browser no longer calls it.

- [ ] **Step 4: Look at the page**

Run: `pnpm build && python3 -m http.server 4173 --directory out`
Then with the local Playwright Chromium (see `scripts/screenshots.mjs` for the `executablePath` this machine uses), capture `/papers/` at 1440×900 and 390×844, in light and dark.
Expected: rail on the right, sticky while the list scrolls; no horizontal scrollbar at 390px; the `Filters` button appears only below `lg` and toggles the panel.

- [ ] **Step 5: Commit**

```bash
git add components/papers app/papers/page.tsx
git commit -m "$(printf 'feat: sticky filter rail on the publications page\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 3: Rendition widths

**Files:**

- Create: `lib/images.ts`
- Create: `lib/images.test.ts`

**Interfaces:**

- Produces: `GRID_WIDTHS`, `FULL_MAX_EDGE`, `thumbnailPlan(sourceWidth: number): number[]`, `orientedSize(metadata): { width: number; height: number }`, `srcSet(renditions: PhotoRendition[]): string`.
- `PhotoRendition` is declared in Task 4; to keep this task independent, `srcSet` takes `ReadonlyArray<{ width: number; url: string }>`, which `PhotoRendition[]` satisfies structurally.

- [ ] **Step 1: Write the failing test**

Create `lib/images.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { GRID_WIDTHS, orientedSize, srcSet, thumbnailPlan } from "./images";

describe("thumbnailPlan", () => {
  it("emits every grid width a large source can fill", () => {
    expect(thumbnailPlan(4032)).toEqual([...GRID_WIDTHS]);
  });

  it("never upscales", () => {
    expect(thumbnailPlan(1200)).toEqual([800]);
    expect(thumbnailPlan(800)).toEqual([800]);
  });

  it("falls back to the source width for an image smaller than the smallest grid width", () => {
    expect(thumbnailPlan(640)).toEqual([640]);
  });
});

describe("orientedSize", () => {
  it("leaves an unrotated image alone", () => {
    expect(orientedSize({ width: 4032, height: 3024, orientation: 1 })).toEqual(
      {
        width: 4032,
        height: 3024,
      },
    );
  });

  it("assumes no rotation when the file carries no orientation tag", () => {
    expect(orientedSize({ width: 4032, height: 3024 })).toEqual({
      width: 4032,
      height: 3024,
    });
  });

  it("swaps the axes for the four orientations that rotate by a quarter turn", () => {
    for (const orientation of [5, 6, 7, 8]) {
      expect(orientedSize({ width: 4032, height: 3024, orientation })).toEqual({
        width: 3024,
        height: 4032,
      });
    }
  });

  it("does not swap for the mirrored orientations below 5", () => {
    expect(orientedSize({ width: 4032, height: 3024, orientation: 2 })).toEqual(
      {
        width: 4032,
        height: 3024,
      },
    );
  });
});

describe("srcSet", () => {
  it("formats a descriptor per rendition", () => {
    expect(
      srcSet([
        { width: 800, url: "/photos/a-800.webp" },
        { width: 1600, url: "/photos/a-1600.webp" },
      ]),
    ).toBe("/photos/a-800.webp 800w, /photos/a-1600.webp 1600w");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run lib/images.test.ts`
Expected: FAIL — `Failed to resolve import "./images"`.

- [ ] **Step 3: Write the implementation**

Create `lib/images.ts`:

```ts
/**
 * Sizes for the build-time image pipeline.
 *
 * A static export cannot optimize images on request, so `scripts/build-gallery-
 * images.ts` writes these renditions once and the markup picks one with
 * `srcset`.
 */

/** Widths offered to the gallery grid: one for most screens, one for retina. */
export const GRID_WIDTHS = [800, 1600] as const;

/** The lightbox image is capped on its longest edge, not its width. */
export const FULL_MAX_EDGE = 2400;

/**
 * Which widths to generate for a source this wide. Never upscales, and always
 * returns at least one width so no `srcset` is ever empty.
 */
export function thumbnailPlan(sourceWidth: number): number[] {
  const widths = GRID_WIDTHS.filter((width) => width <= sourceWidth);
  return widths.length > 0 ? [...widths] : [sourceWidth];
}

/**
 * The size a photo has once EXIF rotation is applied.
 *
 * sharp's `.rotate()` applies the orientation when encoding, but `metadata()`
 * reports the stored, unrotated size. Orientations 5-8 turn the image by a
 * quarter, so the axes have to be swapped — otherwise every portrait photo
 * taken on a phone reserves a landscape box in the grid and the column jumps
 * when the file arrives.
 */
export function orientedSize(metadata: {
  width: number;
  height: number;
  orientation?: number;
}): { width: number; height: number } {
  const quarterTurn = (metadata.orientation ?? 1) >= 5;
  return quarterTurn
    ? { width: metadata.height, height: metadata.width }
    : { width: metadata.width, height: metadata.height };
}

/** A `srcset` value: `url width, url width`. */
export function srcSet(
  renditions: ReadonlyArray<{ width: number; url: string }>,
): string {
  return renditions
    .map((rendition) => `${rendition.url} ${rendition.width}w`)
    .join(", ");
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run lib/images.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/images.ts lib/images.test.ts
git commit -m "$(printf 'feat: rendition width planning for the image pipeline\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 4: Gallery schema and the pure resolver

**Files:**

- Modify: `lib/content/schema.ts` (add the gallery section before `// ---- Courses`, add types with the other exports, add `photos` to `NewsItem`, `Tag` and `ContentGraph`)
- Create: `lib/content/gallery.ts`
- Create: `lib/content/gallery.test.ts`

**Interfaces:**

- Consumes: `slugify` from `lib/slug.ts`; `isoDate` (module-private in `schema.ts`).
- Produces, from `schema.ts`:

  ```ts
  galleryPhotoSchema;
  type GalleryPhotoInput;   // z.input — what content/data/gallery.ts is typed as
  type GalleryPhotoData;    // z.infer — parsed, before ids and sizes
  interface PhotoRendition { width: number; url: string }
  interface PhotoManifestEntry { width: number; height: number; full: string; renditions: PhotoRendition[] }
  type PhotoManifest = Record<string, PhotoManifestEntry>;
  interface RawPhoto extends GalleryPhotoData, PhotoManifestEntry { id: string }
  interface GalleryPhoto extends Omit<RawPhoto, "news"> { url: string; news?: NewsItem }
  ```

  and from `gallery.ts`: `photoId(image: string): string`, `resolvePhotos(entries: GalleryPhotoData[], manifest: PhotoManifest): RawPhoto[]`.

- [ ] **Step 1: Write the failing test**

Create `lib/content/gallery.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { photoId, resolvePhotos } from "./gallery";
import { galleryPhotoSchema, type PhotoManifest } from "./schema";

const entry = (image: string, over: Record<string, unknown> = {}) =>
  galleryPhotoSchema.parse({
    image,
    caption: `Caption for ${image}`,
    date: "2026-05-12",
    ...over,
  });

const sized = (id: string): PhotoManifest[string] => ({
  width: 4032,
  height: 3024,
  full: `/photos/${id}.webp`,
  renditions: [{ width: 800, url: `/photos/${id}-800.webp` }],
});

describe("photoId", () => {
  it("is the file name without its extension, slugified", () => {
    expect(photoId("2026-05-12-thesis-defense.JPG")).toBe(
      "2026-05-12-thesis-defense",
    );
    expect(photoId("Lab retreat (2).jpeg")).toBe("lab-retreat-2");
  });
});

describe("galleryPhotoSchema", () => {
  it("requires an image, a caption and an ISO date", () => {
    expect(() =>
      galleryPhotoSchema.parse({ image: "a.jpg", caption: "C" }),
    ).toThrow();
    expect(() =>
      galleryPhotoSchema.parse({
        image: "a.jpg",
        caption: "C",
        date: "12/05/2026",
      }),
    ).toThrow();
    expect(() =>
      galleryPhotoSchema.parse({ image: "a.jpg", date: "2026-05-12" }),
    ).toThrow();
  });

  it("defaults tags to an empty array and leaves the rest undefined", () => {
    const photo = entry("a.jpg");
    expect(photo.tags).toEqual([]);
    expect(photo.description).toBeUndefined();
    expect(photo.location).toBeUndefined();
    expect(photo.news).toBeUndefined();
  });
});

describe("resolvePhotos", () => {
  it("merges the manifest in and sorts newest first", () => {
    const photos = resolvePhotos(
      [
        entry("a.jpg", { date: "2024-01-01" }),
        entry("b.jpg", { date: "2026-05-12" }),
      ],
      { a: sized("a"), b: sized("b") },
    );
    expect(photos.map((photo) => photo.id)).toEqual(["b", "a"]);
    expect(photos[0].width).toBe(4032);
    expect(photos[0].full).toBe("/photos/b.webp");
  });

  it("names both files when two of them resolve to one id", () => {
    expect(() =>
      resolvePhotos([entry("lab-day.jpg"), entry("lab_day.jpg")], {
        "lab-day": sized("lab-day"),
      }),
    ).toThrow(/lab_day\.jpg.*lab-day\.jpg.*"lab-day"/s);
  });

  it("tells the author to run the pipeline when an image has no renditions", () => {
    expect(() => resolvePhotos([entry("missing.jpg")], {})).toThrow(
      /missing\.jpg.*pnpm build:gallery/s,
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run lib/content/gallery.test.ts`
Expected: FAIL — `Failed to resolve import "./gallery"`.

- [ ] **Step 3: Add the schema and types**

In `lib/content/schema.ts`, insert before the `// ---- Courses` banner:

```ts
// ---- Gallery ---------------------------------------------------------------

export const galleryPhotoSchema = z.object({
  /** File name inside content/gallery/images/. */
  image: z.string().min(1),
  caption: z.string().min(1),
  date: isoDate,
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string().min(1)).default([]),
  /** Slug of a related news item; checked when the graph is built. */
  news: z.string().min(1).optional(),
});

/** One generated width of a photo. */
export interface PhotoRendition {
  width: number;
  url: string;
}

/** What the image pipeline records for a photo. */
export interface PhotoManifestEntry {
  /** Intrinsic size of the source, with EXIF rotation applied. */
  width: number;
  height: number;
  /** The lightbox image. */
  full: string;
  /** Grid widths, smallest first. */
  renditions: PhotoRendition[];
}

export type PhotoManifest = Record<string, PhotoManifestEntry>;
```

With the other type exports:

```ts
export type GalleryPhotoInput = z.input<typeof galleryPhotoSchema>;
export type GalleryPhotoData = z.infer<typeof galleryPhotoSchema>;
```

In the resolved-graph section:

```ts
/** A photo with its file-derived id and generated sizes, before graph linking. */
export interface RawPhoto extends GalleryPhotoData, PhotoManifestEntry {
  id: string;
}

export interface GalleryPhoto extends Omit<RawPhoto, "news"> {
  /** Deep link that opens this photo in the lightbox. */
  url: string;
  news?: NewsItem;
}
```

Add `photos: GalleryPhoto[]` to `NewsItem` and to `Tag`, and to `ContentGraph` add:

```ts
  photos: GalleryPhoto[];
  photosById: Map<string, GalleryPhoto>;
```

- [ ] **Step 4: Write the resolver**

Create `lib/content/gallery.ts`:

```ts
import { slugify } from "../slug";
import type { GalleryPhotoData, PhotoManifest, RawPhoto } from "./schema";

/**
 * Stable id for a photo: its file name, slugified.
 *
 * The file system already guarantees one entry per name, and an id taken from
 * the file survives a reworded caption — which matters, because the id is the
 * photo's deep link.
 */
export function photoId(image: string): string {
  return slugify(image.replace(/\.[^./]+$/, ""));
}

/**
 * Merges the authored metadata with the generated sizes, newest first.
 *
 * Pure, so the whole contract — ids, collisions, missing renditions, order —
 * is unit-tested without touching the file system.
 */
export function resolvePhotos(
  entries: GalleryPhotoData[],
  manifest: PhotoManifest,
): RawPhoto[] {
  const seen = new Map<string, string>();

  const photos = entries.map((entry) => {
    const id = photoId(entry.image);

    const previous = seen.get(id);
    if (previous) {
      throw new Error(
        `duplicate photo in content/data/gallery.ts: "${entry.image}" and "${previous}" both resolve to the id "${id}" — rename one of the files`,
      );
    }
    seen.set(id, entry.image);

    const sizes = manifest[id];
    if (!sizes) {
      throw new Error(
        `no generated image for "${entry.image}" in content/data/gallery.ts — put the file in content/gallery/images/ and run \`pnpm build:gallery\``,
      );
    }

    return { ...entry, ...sizes, id };
  });

  return photos.sort(
    (a, b) =>
      b.date.localeCompare(a.date) || a.caption.localeCompare(b.caption),
  );
}
```

- [ ] **Step 5: Run the tests**

Run: `pnpm vitest run lib/content/gallery.test.ts && pnpm typecheck`
Expected: gallery tests PASS (7). `typecheck` **fails** in `lib/content/graph.ts` and `lib/content/read.ts`, because `NewsItem`, `Tag` and `ContentGraph` now require fields nothing supplies — Task 6 fixes that. Do not patch it here beyond the files this task owns.

- [ ] **Step 6: Commit**

```bash
git add lib/content/schema.ts lib/content/gallery.ts lib/content/gallery.test.ts
git commit -m "$(printf 'feat: gallery photo schema and resolver\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 5: The sharp pipeline

**Files:**

- Create: `scripts/build-gallery-images.ts`
- Create: `content/data/gallery.ts`
- Create: `content/gallery/images/.gitkeep`
- Modify: `package.json` (`sharp` devDependency; `build:gallery` script; `prebuild` and `predev` chains)
- Modify: `.gitignore` (`public/photos/`)

**Interfaces:**

- Consumes: `thumbnailPlan`, `orientedSize`, `FULL_MAX_EDGE` (Task 3); `photoId` (Task 4); `PhotoManifest`, `GalleryPhotoInput` (Task 4).
- Produces: `public/photos/<id>-<width>.webp`, `public/photos/<id>.webp`, `public/photos/manifest.json` conforming to `PhotoManifest`; `content/data/gallery.ts` exporting `GALLERY: GalleryPhotoInput[]`.

- [ ] **Step 1: Install sharp**

```bash
pnpm add -D sharp
```

Expected: `sharp` in `devDependencies`; it is already allow-listed in `pnpm.onlyBuiltDependencies`, so its build script runs without a prompt.

- [ ] **Step 2: Create the (empty) data file and the image folder**

Create `content/data/gallery.ts`:

```ts
import type { GalleryPhotoInput } from "@/lib/content/schema";

/**
 * Photographs shown at /gallery, newest first in the rendered page regardless
 * of the order here.
 *
 * Put the image file in `content/gallery/images/`, then add an entry whose
 * `image` is that file name. `caption` and `date` are required; `description`,
 * `location`, `tags` and `news` are optional. Run `pnpm build:gallery` after
 * adding files.
 *
 *   {
 *     image: "2026-05-12-thesis-defense.jpg",
 *     caption: "A one-line caption, shown under the photo",
 *     date: "2026-05-12",
 *     description: "An optional paragraph, shown in the lightbox.",
 *     location: "Department of Computer Engineering, Sharif University",
 *     tags: ["Graph Mining"],
 *     news: "a-news-slug",
 *   }
 */
export const GALLERY: GalleryPhotoInput[] = [];
```

```bash
mkdir -p content/gallery/images && touch content/gallery/images/.gitkeep
```

- [ ] **Step 3: Write the pipeline script**

Create `scripts/build-gallery-images.ts`:

```ts
/**
 * Generates the gallery's WebP renditions and a manifest of intrinsic sizes.
 *
 * A static export has no image optimizer at request time, so the derivatives
 * are produced here, once, and the grid picks one with `srcset`. Output goes to
 * `public/photos/` — not `public/content/`, which `sync-assets` wipes on every
 * run, which would defeat the mtime cache below.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { photoId } from "../lib/content/gallery";
import type { PhotoManifest } from "../lib/content/schema";
import { FULL_MAX_EDGE, orientedSize, thumbnailPlan } from "../lib/images";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SOURCE_DIR = join(ROOT, "content", "gallery", "images");
const OUT_DIR = join(ROOT, "public", "photos");
const PUBLIC_PREFIX = "/photos";
const SUPPORTED = /\.(jpe?g|png|webp|avif|tiff?)$/i;
const QUALITY = 82;

/** True when the generated file is at least as new as its source. */
function fresh(target: string, source: string): boolean {
  return (
    existsSync(target) && statSync(target).mtimeMs >= statSync(source).mtimeMs
  );
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const files = existsSync(SOURCE_DIR)
    ? readdirSync(SOURCE_DIR)
        .filter((name) => !name.startsWith(".") && SUPPORTED.test(name))
        .sort()
    : [];

  const manifest: PhotoManifest = {};
  let encoded = 0;

  for (const file of files) {
    const source = join(SOURCE_DIR, file);
    const id = photoId(file);
    const metadata = await sharp(source).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(
        `cannot read the dimensions of content/gallery/images/${file}`,
      );
    }

    const { width, height } = orientedSize({
      width: metadata.width,
      height: metadata.height,
      orientation: metadata.orientation,
    });

    const renditions = thumbnailPlan(width).map((target) => ({
      width: target,
      url: `${PUBLIC_PREFIX}/${id}-${target}.webp`,
    }));

    manifest[id] = {
      width,
      height,
      full: `${PUBLIC_PREFIX}/${id}.webp`,
      renditions,
    };

    const jobs = [
      { name: `${id}.webp`, width: FULL_MAX_EDGE, longestEdge: true },
      ...renditions.map((rendition) => ({
        name: `${id}-${rendition.width}.webp`,
        width: rendition.width,
        longestEdge: false,
      })),
    ];

    for (const job of jobs) {
      const target = join(OUT_DIR, job.name);
      if (fresh(target, source)) continue;
      await sharp(source)
        .rotate()
        .resize(
          job.longestEdge
            ? {
                width: job.width,
                height: job.width,
                fit: "inside",
                withoutEnlargement: true,
              }
            : { width: job.width, withoutEnlargement: true },
        )
        .webp({ quality: QUALITY })
        .toFile(target);
      encoded++;
    }
  }

  writeFileSync(
    join(OUT_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(
    `Prepared ${files.length} ${files.length === 1 ? "photo" : "photos"} (${encoded} ${encoded === 1 ? "file" : "files"} encoded)`,
  );
}

void main();
```

- [ ] **Step 4: Wire the scripts**

In `package.json`, add `"build:gallery": "tsx scripts/build-gallery-images.ts"`, and put it after `sync-assets` and before `build-search-index` in both chains:

```json
"prebuild": "tsx scripts/sync-assets.ts && tsx scripts/build-gallery-images.ts && tsx scripts/build-search-index.ts && tsx scripts/generate-og.ts",
"predev": "tsx scripts/sync-assets.ts && tsx scripts/build-gallery-images.ts && tsx scripts/build-search-index.ts",
```

In `.gitignore`, under `public/content/`:

```
public/photos/
```

- [ ] **Step 5: Run it on an empty gallery**

Run: `pnpm build:gallery`
Expected: `Prepared 0 photos (0 files encoded)` and a `public/photos/manifest.json` containing `{}`.

- [ ] **Step 6: Run it on throwaway images**

These files exist only to exercise the pipeline and are deleted in this same step — nothing invented is committed.

```bash
pnpm tsx -e "
import sharp from 'sharp';
const make = (name: string, width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#888888' } })
    .jpeg()
    .toFile('content/gallery/images/' + name);
await Promise.all([
  make('wide.jpg', 4032, 3024),
  make('tall.jpg', 3024, 4032),
  make('small.jpg', 640, 480),
]);
"
```

Run: `pnpm build:gallery && cat public/photos/manifest.json`
Expected: `Prepared 3 photos (8 files encoded)` — `wide` and `tall` each get 800,
1600 and a full; `small` gets 640 and a full. The manifest records `small` with
`renditions: [{ "width": 640, … }]` and no 800.

Run: `pnpm sync:assets && pnpm build:gallery`
Expected: `Prepared 3 photos (0 files encoded)` — the mtime cache survives an
asset sync, which is why the output lives in `public/photos/` rather than
`public/content/`.

- [ ] **Step 7: Confirm an unlisted file is harmless, then clean up**

The three images are in the folder but not in `GALLERY`.

Run: `pnpm build:search && pnpm typecheck`
Expected: no error about them — the pipeline generates renditions for every file it finds, and only `gallery.ts` decides what the site shows. (`typecheck` still fails inside `lib/content/graph.ts` until Task 6.)

```bash
rm content/gallery/images/wide.jpg content/gallery/images/tall.jpg content/gallery/images/small.jpg
rm -f public/photos/*.webp
pnpm build:gallery
git status --short content/gallery
```

Expected: only `.gitkeep` is tracked; `public/photos/` never appears in `git status`.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore content/data/gallery.ts content/gallery/images/.gitkeep scripts/build-gallery-images.ts
git commit -m "$(printf 'feat: build-time webp pipeline for gallery photos\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 6: Read and link the photos

**Files:**

- Modify: `lib/content/read.ts` (imports, `RawContent`, `readContent`)
- Modify: `lib/content/graph.ts` (`brokenRef` helper, the news item's `photos: []`, a gallery section, the tag loop, the return value)
- Modify: `lib/content/index.ts` (two query helpers)
- Modify: `lib/content/testing.ts` (`photos` in the fixture)
- Modify: `lib/content/graph.test.ts` (new cases)

**Interfaces:**

- Consumes: `resolvePhotos` (Task 4); `RawPhoto`, `GalleryPhoto`, `PhotoManifest`, `galleryPhotoSchema` (Task 4); `GALLERY` (Task 5).
- Produces: `RawContent.photos: RawPhoto[]`; `graph.photos`, `graph.photosById`; `newsItem.photos`; `tag.photos` and a `tag.count` that includes photos; `getAllPhotos()`, `getPhoto(id)`; `photo(image, over)` and `photos` in `testing.ts`.

- [ ] **Step 1: Write the failing tests**

In `lib/content/graph.test.ts`, add:

```ts
describe("gallery", () => {
  it("links a photo to its news item and its tags", () => {
    const graph = buildGraph(
      fixture({
        photos: [
          photo("retreat.jpg", {
            news: "n1",
            tags: ["LLMs"],
            date: "2026-02-01",
          }),
        ],
      }),
    );

    expect(graph.photos.map((p) => p.id)).toEqual(["retreat"]);
    expect(graph.photosById.get("retreat")?.url).toBe("/gallery#retreat");
    expect(graph.newsBySlug.get("n1")?.photos.map((p) => p.id)).toEqual([
      "retreat",
    ]);

    const tag = graph.tagsBySlug.get("llms");
    expect(tag?.photos.map((p) => p.id)).toEqual(["retreat"]);
    // one paper, one news item and now one photo
    expect(tag?.count).toBe(4);
  });

  it("fails on a photo that points at a news item that does not exist", () => {
    expect(() =>
      buildGraph(fixture({ photos: [photo("retreat.jpg", { news: "nope" })] })),
    ).toThrow(
      /content\/data\/gallery\.ts[\s\S]*news: no news item with id "nope"/,
    );
  });

  it("leaves news items and tags with empty photo lists when there is no gallery", () => {
    const graph = buildGraph(fixture());
    expect(graph.photos).toEqual([]);
    expect(graph.newsBySlug.get("n1")?.photos).toEqual([]);
    expect(graph.tagsBySlug.get("llms")?.photos).toEqual([]);
  });
});
```

Check the existing `tag.count` expectations in that file first: `fixture()` gives `LLMs` two papers and one news item. Use the real number the suite already asserts rather than the `4` above if it differs — the point of the assertion is that a photo adds exactly one.

Add `photo` to the imports from `./testing`.

- [ ] **Step 2: Extend the fixture**

In `lib/content/testing.ts`, add to the imports `galleryPhotoSchema`, then:

```ts
export const photo = (image: string, extra: Record<string, unknown> = {}) => {
  const data = galleryPhotoSchema.parse({
    image,
    caption: image,
    date: "2026-01-01",
    ...extra,
  });
  const id = photoId(image);
  return {
    ...data,
    id,
    width: 1600,
    height: 1200,
    full: `/photos/${id}.webp`,
    renditions: [{ width: 800, url: `/photos/${id}-800.webp` }],
  };
};
```

with `import { photoId } from "./gallery";` at the top, and add `photos: []` to the object `fixture()` returns (before the `...over` spread, so a test can override it).

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm vitest run lib/content/graph.test.ts`
Expected: FAIL — `raw.photos` is not used by `buildGraph`, so `graph.photos` is `undefined`.

- [ ] **Step 4: Read the gallery in `read.ts`**

Add to the imports:

```ts
import { GALLERY } from "@/content/data/gallery";
import { resolvePhotos } from "./gallery";
import {
  galleryPhotoSchema,
  type PhotoManifest,
  type RawPhoto,
} from "./schema";
```

Add `photos: RawPhoto[];` to `RawContent`, and:

```ts
const MANIFEST_PATH = join(process.cwd(), "public", "photos", "manifest.json");

/**
 * The gallery: authored metadata from `content/data/gallery.ts`, merged with
 * the sizes `scripts/build-gallery-images.ts` recorded.
 */
function readPhotos(): RawPhoto[] {
  const entries = GALLERY.map((entry, index) => {
    try {
      return galleryPhotoSchema.parse(entry);
    } catch (error) {
      throw new Error(
        `invalid photo #${index + 1} in content/data/gallery.ts:\n${describeError(error)}`,
      );
    }
  });

  if (entries.length === 0) return [];

  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(
      "content/data/gallery.ts lists photos but public/photos/manifest.json is missing — run `pnpm build:gallery`",
    );
  }

  const manifest = JSON.parse(
    readFileSync(MANIFEST_PATH, "utf8"),
  ) as PhotoManifest;
  return resolvePhotos(entries, manifest);
}
```

and `photos: readPhotos(),` in the object `readContent()` returns.

- [ ] **Step 5: Link them in `graph.ts`**

Add `GalleryPhoto` to the type imports. Split the error helper so a non-document source can report the same way:

```ts
/** Throws a build error that names the offending file and field. */
function brokenRef(
  file: string,
  field: string,
  value: string,
  kind: string,
): never {
  throw new Error(
    `broken reference in ${file}:\n  ${field}: no ${kind} with id "${value}"`,
  );
}

function referenceError(
  doc: RawDoc<unknown>,
  field: string,
  value: string,
  kind: string,
): never {
  return brokenRef(doc.file, field, value, kind);
}
```

Add `photos: [],` to the object pushed into `newsBySlug`. After the news section, before `// ---- Positions`:

```ts
// ---- Gallery ------------------------------------------------------------
// Already newest first: `resolvePhotos` sorts, so the graph only links.
const photosById = new Map<string, GalleryPhoto>();
for (const entry of raw.photos) {
  const { news: newsSlug, ...rest } = entry;
  const photo: GalleryPhoto = {
    ...rest,
    url: `/gallery#${entry.id}`,
    ...(newsSlug
      ? {
          news:
            newsBySlug.get(newsSlug) ??
            brokenRef("content/data/gallery.ts", "news", newsSlug, "news item"),
        }
      : {}),
  };
  photosById.set(photo.id, photo);
}
const photos = [...photosById.values()];
for (const photo of photos) photo.news?.photos.push(photo);
```

In `tagFor`, add `photos: [],` to the new tag object. After the news tag loop:

```ts
for (const photo of photos) {
  for (const name of photo.tags) {
    const tag = tagFor(name);
    tag.photos.push(photo);
    tag.count++;
  }
}
```

And add `photos,` and `photosById,` to the frozen return value.

- [ ] **Step 6: Add the query helpers**

In `lib/content/index.ts`, add `GalleryPhoto` to the type imports and:

```ts
/** Gallery photographs, newest first. */
export function getAllPhotos(): GalleryPhoto[] {
  return getGraph().photos;
}

export function getPhoto(id: string): GalleryPhoto | undefined {
  return getGraph().photosById.get(id);
}
```

- [ ] **Step 7: Run everything**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all pass, including the three new graph cases.

- [ ] **Step 8: Commit**

```bash
git add lib/content
git commit -m "$(printf 'feat: read gallery photos into the content graph\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 7: Photos in site search

**Files:**

- Modify: `lib/search.ts` (`SEARCH_KINDS`)
- Modify: `lib/search-docs.ts` (a photo loop)
- Modify: `components/layout/search-dialog.tsx` (`GROUP_LABELS`)
- Modify: `lib/search-docs.test.ts`

**Interfaces:**

- Consumes: `graph.photos` (Task 6); `formatDate` from `lib/format.ts`.
- Produces: search documents with `kind: "photo"`, `id: "photo:<id>"`, `url: "/gallery#<id>"`.

- [ ] **Step 1: Write the failing test**

`lib/search-docs.test.ts` already imports `buildGraph` from `./content/graph` and
`fixture` from `./content/testing`; widen the second import to
`import { fixture, photo } from "./content/testing";` and add, inside the
existing `describe("collectSearchDocs", …)` block:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run lib/search-docs.test.ts`
Expected: FAIL — `doc` is `undefined`.

- [ ] **Step 3: Implement**

In `lib/search.ts`, add `"photo"` to `SEARCH_KINDS` after `"news"`.

In `lib/search-docs.ts`, add `import { formatDate } from "./format";` and, after the news loop:

```ts
for (const photo of graph.photos) {
  docs.push({
    id: `photo:${photo.id}`,
    kind: "photo",
    url: photo.url,
    title: photo.caption,
    description: [formatDate(photo.date), photo.location]
      .filter(Boolean)
      .join(" · "),
    related: photo.news ? [photo.news.title] : [],
    tags: photo.tags,
    text: photo.description ?? "",
  });
}
```

In `components/layout/search-dialog.tsx`, add `photo: "Gallery",` to `GROUP_LABELS` (it is a `Record<SearchKind, string>`, so leaving it out is a type error).

- [ ] **Step 4: Run the tests**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/search.ts lib/search-docs.ts lib/search-docs.test.ts components/layout/search-dialog.tsx
git commit -m "$(printf 'feat: index gallery photos for site search\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 8: The gallery page, grid and lightbox

**Files:**

- Modify: `lib/content/summaries.ts` (`toPhotoSummary`)
- Create: `components/gallery/gallery-grid.tsx`
- Create: `components/gallery/gallery-lightbox.tsx`
- Create: `app/gallery/page.tsx`

**Interfaces:**

- Consumes: `getAllPhotos()` (Task 6); `srcSet` (Task 3); `formatDate` from `lib/format.ts`; `Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription` from `components/ui/dialog.tsx`; `assetPath` from `lib/site.ts` (raw `<img>` URLs need the base path).
- Produces: `PhotoSummary` and `toPhotoSummary(photo: GalleryPhoto): PhotoSummary`; `GalleryGrid({ photos }: { photos: PhotoSummary[] })`; `GalleryLightbox({ photos, index, onIndexChange, onClose })`.

- [ ] **Step 1: Add the projection**

In `lib/content/summaries.ts`:

```ts
import { slugify } from "../slug";
import type { GalleryPhoto, Paper } from "./schema";
import type { PhotoSummary } from "@/components/gallery/gallery-grid";

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
```

- [ ] **Step 2: Write the lightbox**

Create `components/gallery/gallery-lightbox.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { assetPath } from "@/lib/site";

import type { PhotoSummary } from "./gallery-grid";

/**
 * The detail view for one photograph.
 *
 * Base UI's dialog supplies the focus trap, the `Esc` handler and the scroll
 * lock; the arrow keys are wired here, over the same filtered list the grid
 * shows, so paging never jumps to a hidden photo.
 */
export function GalleryLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: PhotoSummary[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];

  useEffect(() => {
    if (!photo) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        onIndexChange((index + 1) % photos.length);
      } else if (event.key === "ArrowLeft") {
        onIndexChange((index - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [photo, index, photos.length, onIndexChange]);

  if (!photo) return null;

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      {/* `DialogContent` caps itself at `sm:max-w-sm`; widen it from `sm` up. */}
      <DialogContent className="sm:max-w-5xl">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export: no optimizer */}
          <img
            src={assetPath(photo.full)}
            alt={photo.caption}
            width={photo.width}
            height={photo.height}
            className="max-h-[70dvh] w-full rounded-md object-contain"
          />
          <figcaption className="mt-5">
            <DialogTitle className="text-lg font-semibold leading-snug tracking-tight">
              {photo.caption}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
              {[formatDate(photo.date), photo.location]
                .filter(Boolean)
                .join(" · ")}
            </DialogDescription>
            {photo.description ? (
              <p className="mt-3 font-serif leading-relaxed text-foreground/90">
                {photo.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {photo.news ? (
                <Link href={photo.news.url} className="link-underline">
                  {photo.news.title}
                </Link>
              ) : null}
              {photo.tags.map((tag) => (
                <Link
                  key={tag.url}
                  href={tag.url}
                  className="text-muted-foreground transition-colors hover:text-primary-ink"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </figcaption>
        </figure>

        {photos.length > 1 ? (
          <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() =>
                onIndexChange((index - 1 + photos.length) % photos.length)
              }
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>
            <span className="font-mono text-xs">
              {index + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={() => onIndexChange((index + 1) % photos.length)}
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Write the grid**

Create `components/gallery/gallery-grid.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDate } from "@/lib/format";
import { srcSet } from "@/lib/images";
import { assetPath } from "@/lib/site";
import { cn } from "@/lib/utils";

import { GalleryLightbox } from "./gallery-lightbox";

/** Serializable shape of a photo for the client grid. */
export interface PhotoSummary {
  id: string;
  caption: string;
  date: string;
  description?: string;
  location?: string;
  width: number;
  height: number;
  full: string;
  renditions: Array<{ width: number; url: string }>;
  tags: Array<{ name: string; url: string }>;
  news?: { title: string; url: string };
}

const SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="me-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {["all", ...options].map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors",
            value === option
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-input text-muted-foreground hover:border-ring hover:text-foreground",
          )}
        >
          {option === "all" ? "All" : option}
        </button>
      ))}
    </div>
  );
}

/**
 * The gallery: a masonry grid of photographs with a lightbox.
 *
 * Every tile carries the intrinsic size the build recorded, so the column
 * reserves the right height before the file arrives and nothing below it moves.
 */
export function GalleryGrid({ photos }: { photos: PhotoSummary[] }) {
  const [year, setYear] = useState("all");
  const [tag, setTag] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const years = useMemo(
    () =>
      [...new Set(photos.map((photo) => photo.date.slice(0, 4)))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [photos],
  );
  const tags = useMemo(
    () =>
      [
        ...new Set(
          photos.flatMap((photo) => photo.tags.map((item) => item.name)),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [photos],
  );

  const filtered = useMemo(
    () =>
      photos.filter(
        (photo) =>
          (year === "all" || photo.date.startsWith(year)) &&
          (tag === "all" || photo.tags.some((item) => item.name === tag)),
      ),
    [photos, year, tag],
  );

  // A pasted or searched `#id` opens that photo. An id that matches nothing —
  // or a photo the filters hide — simply leaves the page closed.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id && photos.some((photo) => photo.id === id)) setOpenId(id);
  }, [photos]);

  useEffect(() => {
    const url = openId
      ? `#${openId}`
      : `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", url);
  }, [openId]);

  const index = filtered.findIndex((photo) => photo.id === openId);

  return (
    <div>
      {years.length > 1 || tags.length > 0 ? (
        <div className="flex flex-col gap-3 border-b py-5 sm:flex-row sm:items-center sm:gap-6">
          <Chips label="Year" options={years} value={year} onChange={setYear} />
          <Chips label="Topic" options={tags} value={tag} onChange={setTag} />
        </div>
      ) : null}

      <p className="py-4 text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} of {photos.length} photographs
      </p>

      {filtered.length === 0 ? (
        <p className="border-t py-16 text-center text-sm text-muted-foreground">
          No photographs match these filters.
        </p>
      ) : (
        <ul className="gap-5 pb-16 sm:columns-2 lg:columns-3">
          {filtered.map((photo) => (
            <li key={photo.id} className="mb-5 break-inside-avoid">
              <button
                type="button"
                onClick={() => setOpenId(photo.id)}
                className="group w-full text-start"
                aria-label={`Open: ${photo.caption}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static export: no optimizer */}
                <img
                  src={assetPath(photo.renditions[0].url)}
                  srcSet={srcSet(
                    photo.renditions.map((rendition) => ({
                      width: rendition.width,
                      url: assetPath(rendition.url),
                    })),
                  )}
                  sizes={SIZES}
                  alt={photo.caption}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-md border bg-card transition-opacity group-hover:opacity-90"
                />
                <p className="mt-2.5 text-sm font-medium leading-snug tracking-tight transition-colors group-hover:text-primary-ink">
                  {photo.caption}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[formatDate(photo.date), photo.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {index >= 0 ? (
        <GalleryLightbox
          photos={filtered}
          index={index}
          onIndexChange={(next) => setOpenId(filtered[next].id)}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Write the page**

Create `app/gallery/page.tsx`:

```tsx
import type { Metadata } from "next";

import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { PageHeader } from "@/components/layout/page-header";
import { getAllPhotos } from "@/lib/content";
import { toPhotoSummary } from "@/lib/content/summaries";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Gallery",
  description:
    "Photographs from DAISY Lab: talks, defences, workshops and everyday work in the lab.",
  path: "/gallery",
});

export default function GalleryPage() {
  const photos = getAllPhotos();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHeader
        title="Gallery"
        lead="Photographs from the lab — talks, defences, workshops and the days in between."
      />
      {photos.length === 0 ? (
        <p className="py-16 text-sm text-muted-foreground">
          Photographs will appear here.
        </p>
      ) : (
        <GalleryGrid photos={photos.map(toPhotoSummary)} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Check it compiles**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all pass. `DialogContent` merges `className` through `cn`, so `sm:max-w-5xl` overrides its own `sm:max-w-sm`; a bare `max-w-5xl` would lose to it at `sm` and up.

- [ ] **Step 6: Verify with throwaway photos**

Regenerate three placeholder images exactly as in Task 5, Step 6, add three matching entries to `GALLERY` **without committing them** — one with every optional field, one with only caption and date, one with a `news` slug that exists in `content/news/` — then:

```bash
pnpm build && python3 -m http.server 4173 --directory out
```

With the local Playwright Chromium, check `/gallery/`:

- tiles keep their aspect ratio before and after loading (no jump);
- clicking a tile opens the lightbox; `Esc` closes it; `ArrowRight`/`ArrowLeft` page through; the counter matches;
- the URL gains `#<id>`, and reloading that URL reopens the same photo;
- `/gallery/#does-not-exist` loads with the lightbox closed;
- filtering by a topic, then opening a photo, then paging, never shows a filtered-out photo;
- both themes at 1440×900 and 390×844.

Then revert the entries: `git checkout content/data/gallery.ts` and delete the placeholder files and their renditions.

- [ ] **Step 7: Commit**

```bash
git add lib/content/summaries.ts components/gallery app/gallery
git commit -m "$(printf 'feat: gallery page with masonry grid and lightbox\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 9: Wire the gallery into the rest of the site

**Files:**

- Modify: `lib/site.ts` (`NAV_ITEMS` gains Gallery)
- Modify: `components/layout/header.tsx` (take items from a prop)
- Modify: `app/layout.tsx` (pass the items)
- Modify: `app/sitemap.ts`
- Modify: `scripts/generate-og.ts`
- Modify: `app/news/[slug]/page.tsx`, `app/tags/[tag]/page.tsx`
- Modify: `README.md`

**Interfaces:**

- Consumes: `getAllPhotos()` (Task 6); `NAV_ITEMS` (existing).
- Produces: `navItems(hasPhotos: boolean)` in `lib/site.ts`; `Header({ items })`.

- [ ] **Step 1: Hide an empty gallery from the navigation**

In `lib/site.ts`, add the item and a filter. `lib/site.ts` must stay free of content imports (the client header imports it), so the decision is passed in:

```ts
export const NAV_ITEMS = [
  { href: "/research", label: "Research" },
  { href: "/papers", label: "Publications" },
  { href: "/people", label: "People" },
  { href: "/news", label: "News" },
  { href: "/gallery", label: "Gallery" },
  { href: "/teaching", label: "Teaching" },
  { href: "/join", label: "Join Us" },
] as const;

export type NavItem = { href: string; label: string };

/** An empty gallery should not advertise itself in the navigation. */
export function navItems(hasPhotos: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => hasPhotos || item.href !== "/gallery");
}
```

In `components/layout/header.tsx`, take `items: NavItem[]` as a prop and map over it in both navigations instead of `NAV_ITEMS`. In `app/layout.tsx`, render
`<Header items={navItems(getAllPhotos().length > 0)} />`.

`components/layout/footer.tsx` also maps `NAV_ITEMS` (line 30). It is a server
component, so it calls `navItems(getAllPhotos().length > 0)` itself and needs no
prop.

- [ ] **Step 2: Sitemap and Open Graph card**

In `app/sitemap.ts`, import `getAllPhotos`, and add to `pages` — only when the gallery has photos:

```ts
if (getAllPhotos().length > 0) {
  pages.push({
    url: absoluteUrl("/gallery"),
    priority: 0.5,
    changeFrequency: "monthly",
  });
}
```

(`pages` is already a `MetadataRoute.Sitemap`, so declare it with `const` and push, keeping the existing `priority`/`changeFrequency` typing.)

In `scripts/generate-og.ts`, import `getAllPhotos` from `../lib/content` and, after the default card:

```ts
const photos = getAllPhotos();
if (photos.length > 0) {
  await render(
    {
      kind: "Gallery",
      title: "Photographs from the lab",
      subtitle: photos[0].caption,
      meta: formatDate(photos[0].date),
      image: loadImage(photos[0].renditions[0].url),
    },
    "gallery.png",
  );
  count++;
}
```

`loadImage` already accepts `webp` in its extension list, and
`/photos/<id>-800.webp` lives under `public/`, so the data URI resolves.

Add `gallery: () => "/og/gallery.png"` to `ogImage` in `lib/seo.tsx`. The card
only exists when there are photos, so the page must decide at build time rather
than in a module-level constant: in `app/gallery/page.tsx` replace
`export const metadata` with

```tsx
export function generateMetadata(): Metadata {
  const photos = getAllPhotos();
  return buildMetadata({
    title: "Gallery",
    description:
      "Photographs from DAISY Lab: talks, defences, workshops and everyday work in the lab.",
    path: "/gallery",
    ...(photos.length > 0 ? { image: ogImage.gallery() } : {}),
  });
}
```

and add `ogImage` to the `@/lib/seo` import.

- [ ] **Step 3: Show photos where they belong**

In `app/news/[slug]/page.tsx`, after the MDX body and before the related papers, add — only when `item.photos.length > 0`:

```tsx
<section className="border-t py-10">
  <h2 className="text-xl font-semibold tracking-tight">Photographs</h2>
  <ul className="mt-4 grid gap-4 sm:grid-cols-3">
    {item.photos.map((photo) => (
      <li key={photo.id}>
        <Link href={photo.url} className="group block">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export: no optimizer */}
          <img
            src={assetPath(photo.renditions[0].url)}
            alt={photo.caption}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            className="w-full rounded-md border object-cover transition-opacity group-hover:opacity-90"
          />
          <p className="mt-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
            {photo.caption}
          </p>
        </Link>
      </li>
    ))}
  </ul>
</section>
```

In `app/tags/[tag]/page.tsx`, add the same block for `tag.photos` after the News section, with the heading `Gallery`, so the item count in the lead stays honest.

- [ ] **Step 4: Document it**

In `README.md`:

- In the repository map, add `components/gallery/` and `content/gallery/images/`.
- In the scripts table, add `pnpm build:gallery` — "Generate gallery renditions into `public/photos/`".
- Under **Authoring**, after the courses subsection, add a `### A photograph — content/data/gallery.ts` subsection: where the file goes, the full field list with which are required, that `caption` and `date` are required and the rest optional, that the id comes from the file name (so renaming a file changes its link), that `tags` join the site's topic pages and `news` must be an existing news slug, and that `pnpm build:gallery` regenerates the renditions (and runs automatically in `prebuild`/`predev`).
- In **Replace the sample content**, note that the gallery starts empty by design.

- [ ] **Step 5: Verify**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: all pass. With `GALLERY` empty, the built `out/` contains `gallery/index.html`, the sitemap has **no** `/gallery` entry, no `og/gallery.png` exists, and the header shows six items.

Then repeat with the three throwaway photos from Task 5 in place (one of them referencing a real news slug): the sitemap gains `/gallery`, `og/gallery.png` is written, the header shows seven items and does not wrap at 1024px, and the news item's page shows its photograph. Revert the throwaway content afterwards.

- [ ] **Step 6: Commit**

```bash
git add lib/site.ts components/layout app/layout.tsx app/sitemap.ts app/gallery scripts/generate-og.ts lib/seo.tsx "app/news/[slug]/page.tsx" "app/tags/[tag]/page.tsx" README.md
git commit -m "$(printf 'feat: link the gallery into navigation, sitemap, news and tags\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

---

### Task 10: Whole-branch verification

**Files:**

- Modify: whatever the checks turn up.

**Interfaces:** none.

- [ ] **Step 1: Confirm the tree is clean of throwaway content**

```bash
git status --short
ls content/gallery/images
```

Expected: nothing uncommitted; only `.gitkeep` in the images folder.

- [ ] **Step 2: Run the full gate**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm prettier:check && pnpm build`
Expected: all pass; the build reports one more page than before (`/gallery`).

- [ ] **Step 3: Verify the base-path deployment**

```bash
rm -rf /tmp/basepath && mkdir -p /tmp/basepath/daisy
NEXT_PUBLIC_BASE_PATH=/daisy pnpm build && cp -R out/. /tmp/basepath/daisy/
python3 -m http.server 4174 --directory /tmp/basepath
```

Visit `http://localhost:4174/daisy/papers/` and `/daisy/gallery/`: the rail works, photo URLs carry the `/daisy` prefix (this is what `assetPath` is for), and the search dialog still loads its index.

- [ ] **Step 4: Visual pass**

With throwaway photos in place, capture `/papers/` and `/gallery/` at 1440×900 and 390×844 in both themes, and check the console for errors. Confirm no uppercase-styled labels crept in and that the brand yellow is used for fills and marks only, never body text. Revert the throwaway content.

- [ ] **Step 5: Commit any fixes and finish**

If steps 1-4 turned up nothing, there is nothing to commit — skip to the merge.
If they did, fix it, re-run step 2, and commit the fix on its own, describing
the actual defect in the subject line:

```bash
git add -A
git commit -m "$(printf 'fix: reserve the rotated aspect ratio for portrait photos\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>')"
```

Then use the `superpowers:finishing-a-development-branch` skill to merge.
