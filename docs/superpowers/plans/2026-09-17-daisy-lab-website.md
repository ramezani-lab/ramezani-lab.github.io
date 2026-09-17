# DAISY Lab Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static English website for DAISY Lab (Data-Centric AI Systems, Sharif CE) with people, papers (MDX), research areas, news, teaching, join pages and build-time search.

**Architecture:** Mirrors `byte-new-website`: MDX + typed data in `content/`, validated by Zod, resolved once into a frozen content graph (`lib/content/graph.ts`) that every route and every `prebuild` script reads. Static export only; the search index is serialized MiniSearch JSON written in `prebuild`.

**Tech Stack:** Next.js 16.3.3 (App Router, `output: "export"`), React 19.2.8, TypeScript strict, Tailwind v4, shadcn base-lyra (Base UI), next-mdx-remote-client, gray-matter, Zod 4, Shiki via rehype-pretty-code, KaTeX, MiniSearch 7, motion, zustand, Vitest 4, Satori + resvg, pnpm 10.18.2.

**Spec:** `docs/superpowers/specs/2026-09-17-daisy-lab-website-design.md`

## Global Constraints

- English only, `lang="en"`, LTR, formal copy.
- Fully static: `output: "export"`, `trailingSlash: true`, `images.unoptimized`.
- Primary colour defined once as `--brand` in `app/globals.css`; `--primary` in both themes reads it; tints derive via `color-mix()`.
- Primary is never used as body-text colour.
- Default theme light (cream); toggle light / dark / system; storage key `daisy-theme`.
- Invalid frontmatter or a dangling reference fails the build naming file and field.
- Raw asset URLs (fetch, `<img src>`) go through `assetPath()` so `NEXT_PUBLIC_BASE_PATH` works.
- Same scripts as Byte: `dev, build, start, lint, typecheck, test, test:watch, prettier, prettier:check, prebuild, sync:assets, build:search, generate:og`.

## File Map

```
app/                         routes (see Tasks 9–13)
components/ui/               shadcn primitives copied from Byte
components/layout/           header, footer, logo, search-dialog, theme-*
components/brand/            daisy-mark.tsx, sharif-logo.tsx
components/cards/            person-card, paper-card, news-card, area-card
components/content/          callout, figure, author-list, link-buttons, tag-list, bibtex-copy, social-links, section-heading
components/papers/           paper-browser.tsx (client filters)
components/sections/         home page sections
components/motion/           reveal.tsx
lib/site.ts                  SITE, NAV_ITEMS, assetPath()
lib/fonts.ts                 next/font/local families
lib/utils.ts                 cn()
lib/format.ts                formatDate(), formatMonthYear()
lib/content/schema.ts        Zod schemas + resolved types
lib/content/assets.ts        resolveAsset()
lib/content/read.ts          filesystem reader → RawContent
lib/content/graph.ts         buildGraph(raw) (pure) + getGraph() (cached fs)
lib/content/people.ts        groupPeople(), ROLE_LABELS
lib/content/bibtex.ts        buildBibtex()
lib/content/index.ts         query helpers
lib/mdx/{options,components}.ts(x)
lib/search.ts                MiniSearch options, build/load/query
lib/search-docs.ts           collectSearchDocs(graph)
lib/seo.tsx                  metadata + JSON-LD
lib/stores/{theme,theme-key}.ts
scripts/{sync-assets,build-search-index,generate-og}.ts
content/{people,papers,news,research,positions}/<slug>/index.mdx
content/data/courses.ts
```

---

### Task 1: Scaffold project

**Files:** Create `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.mts`, `postcss.config.mjs`, `.prettierrc`, `.prettierignore`, `.npmrc`, `.env.example`, `components.json`, `AGENTS.md`, `CLAUDE.md`, `lib/utils.ts`, `lib/utils.test.ts`, `components/ui/*` (copy from Byte: badge, button, card, dialog, dropdown-menu, input, separator, sheet, tooltip, tabs, popover, scroll-area, skeleton).

**Interfaces:** Produces `cn(...inputs: ClassValue[]): string`.

- [ ] Copy Byte configs verbatim, then: `components.json` → `"rtl": false`, drop registries; eslint ignores drop `shot.mjs`, rule override only for `components/ui/**`; `.env.example` documents `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_BASE_PATH`.
- [ ] `package.json` deps = Byte's minus `gsap, ogl, mermaid, katex-free extras none`, plus `minisearch`; devDeps add `@fontsource/instrument-sans`, `@fontsource-variable/instrument-sans`, `@fontsource-variable/newsreader`, `@fontsource-variable/jetbrains-mono`. Scripts per Global Constraints; `prebuild` = `tsx scripts/sync-assets.ts && tsx scripts/build-search-index.ts && tsx scripts/generate-og.ts`.
- [ ] Copy UI primitives; replace any `rtl:` variants / `side="left"` defaults so they read correctly in LTR.
- [ ] Test `lib/utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges conflicting tailwind classes, last wins", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});
```

- [ ] Run `pnpm install && pnpm test && pnpm typecheck` → PASS.
- [ ] Commit `chore: scaffold next.js project`.

### Task 2: Brand, tokens, fonts, theme

**Files:** Create `app/globals.css`, `lib/fonts.ts`, `public/fonts/*.woff2`, `assets/fonts/InstrumentSans-{400,600,700}.woff`, `components/brand/daisy-mark.tsx`, `components/brand/sharif-logo.tsx`, `public/img/logo.svg`, `public/img/sharif.svg`, `app/icon.svg`, `lib/stores/theme-key.ts`, `lib/stores/theme.ts`, `components/layout/theme-script.tsx`, `components/layout/theme-toggle.tsx`.

**Interfaces:** Produces `<DaisyMark className? />` (SVG, `currentColor` ink, `var(--primary)` centre), `<SharifLogo className? />`, `fontVariables: string`, tokens `bg-background text-foreground bg-card text-muted-foreground bg-primary text-primary-foreground bg-primary-soft border-border ring-ring`, font utilities `font-sans font-serif font-mono`, `useThemeStore` (`theme`, `resolvedTheme`, `setTheme`, `syncSystem`).

- [ ] `globals.css`: `:root { --brand: oklch(0.84 0.16 88); --brand-foreground: oklch(0.23 0.02 85); }` then light tokens on `:root` (cream background `oklch(0.955 0.013 85)`, card `oklch(0.985 0.006 85)`, ink `oklch(0.25 0.008 85)`), `.dark` warm charcoal tokens; `--primary: var(--brand)`, `--primary-soft: color-mix(in oklch, var(--primary) 22%, var(--background))`, `--ring: color-mix(in oklch, var(--primary) 70%, var(--foreground))`. `@custom-variant dark (&:is(.dark *))`. Prose styles adapted from Byte for LTR, serif body, links underlined with primary.
- [ ] Theme script/store copied from Byte with default `"light"` and key `daisy-theme`.
- [ ] Fonts: copy latin variable woff2 files from fontsource packages into `public/fonts/`, static woff files into `assets/fonts/` for Satori.
- [ ] Sharif logo SVG downloaded from Wikimedia Commons; DAISY mark redrawn to match the supplied logo (orbit arc with two nodes, eight petals, yellow centre).
- [ ] Commit `feat: brand tokens, fonts, theme`.

### Task 3: Content schemas, asset resolution, reader

**Files:** Create `lib/content/schema.ts`, `lib/content/assets.ts`, `lib/content/read.ts`; Test `lib/content/schema.test.ts`, `lib/content/assets.test.ts`.

**Interfaces:**

- `ROLES = ["director","postdoc","phd","msc","bsc","alumni"] as const`, `type Role`.
- `personFrontmatterSchema`, `paperFrontmatterSchema`, `newsFrontmatterSchema`, `researchFrontmatterSchema`, `positionFrontmatterSchema`, `courseSchema` and inferred types `PersonFrontmatter, PaperFrontmatter, NewsFrontmatter, ResearchFrontmatter, PositionFrontmatter, Course`.
- `resolveAsset(collection: string, slug: string, value?: string): string | undefined`.
- `interface RawDoc<T> { slug: string; file: string; frontmatter: T; body: string }`
- `interface RawContent { people: RawDoc<PersonFrontmatter>[]; papers: RawDoc<PaperFrontmatter>[]; news: RawDoc<NewsFrontmatter>[]; research: RawDoc<ResearchFrontmatter>[]; positions: RawDoc<PositionFrontmatter>[]; courses: Course[] }`
- `readContent(root?: string): RawContent`

- [ ] Write failing tests:

```ts
// lib/content/assets.test.ts
import { describe, expect, it } from "vitest";
import { resolveAsset } from "./assets";

describe("resolveAsset", () => {
  it("maps a relative path into public/content", () => {
    expect(resolveAsset("papers", "dani", "./cover.png")).toBe(
      "/content/papers/dani/cover.png",
    );
    expect(resolveAsset("papers", "dani", "img/a.png")).toBe(
      "/content/papers/dani/img/a.png",
    );
  });
  it("keeps absolute and remote paths", () => {
    expect(resolveAsset("people", "x", "/img/a.png")).toBe("/img/a.png");
    expect(resolveAsset("people", "x", "https://e.com/a.png")).toBe(
      "https://e.com/a.png",
    );
  });
  it("passes undefined through", () => {
    expect(resolveAsset("people", "x", undefined)).toBeUndefined();
  });
});
```

```ts
// lib/content/schema.test.ts
import { describe, expect, it } from "vitest";
import { paperFrontmatterSchema, personFrontmatterSchema } from "./schema";

describe("personFrontmatterSchema", () => {
  it("applies defaults", () => {
    const p = personFrontmatterSchema.parse({ name: "A", role: "phd" });
    expect(p.interests).toEqual([]);
    expect(p.socials).toEqual({});
    expect(p.order).toBe(100);
  });
  it("rejects unknown roles", () => {
    expect(() =>
      personFrontmatterSchema.parse({ name: "A", role: "dean" }),
    ).toThrow();
  });
});

describe("paperFrontmatterSchema", () => {
  const base = {
    title: "T",
    abstract: "A",
    authors: ["x"],
    year: 2024,
    venue: { name: "V", type: "journal" },
  };
  it("defaults status, tags, links", () => {
    const p = paperFrontmatterSchema.parse(base);
    expect(p.status).toBe("published");
    expect(p.tags).toEqual([]);
    expect(p.links).toEqual([]);
    expect(p.featured).toBe(false);
  });
  it("requires at least one author", () => {
    expect(() =>
      paperFrontmatterSchema.parse({ ...base, authors: [] }),
    ).toThrow();
  });
  it("validates link urls and types", () => {
    expect(() =>
      paperFrontmatterSchema.parse({
        ...base,
        links: [{ type: "arxiv", url: "nope" }],
      }),
    ).toThrow();
    expect(() =>
      paperFrontmatterSchema.parse({
        ...base,
        links: [{ type: "tweet", url: "https://x.com" }],
      }),
    ).toThrow();
  });
});
```

- [ ] `pnpm vitest run lib/content` → FAIL (modules missing).
- [ ] Implement schemas per spec, `resolveAsset`, and `readContent` (folder-per-doc `index.mdx`, errors `invalid frontmatter in <file>:\n<zod message>`).
- [ ] `pnpm vitest run lib/content` → PASS. Commit `feat: content schemas and reader`.

### Task 4: BibTeX and people grouping

**Files:** Create `lib/content/bibtex.ts`, `lib/content/people.ts`; Test `lib/content/bibtex.test.ts`, `lib/content/people.test.ts`.

**Interfaces:**

- `buildBibtex(input: { title: string; authors: string[]; year: number; venue: { name: string; type: VenueType }; links: PaperLink[] }): string`
- `bibtexKey(authors: string[], year: number, title: string): string`
- `ROLE_GROUPS: { role: Role; label: string }[]` in display order; `groupPeople<T extends { role: Role; order: number; name: string; startYear?: number; endYear?: number }>(people: T[]): { role: Role; label: string; people: T[] }[]` (empty groups omitted; alumni by `endYear` desc).

- [ ] Failing tests:

```ts
// lib/content/bibtex.test.ts
import { describe, expect, it } from "vitest";
import { bibtexKey, buildBibtex } from "./bibtex";

describe("bibtexKey", () => {
  it("uses first author surname, year, first significant title word", () => {
    expect(
      bibtexKey(
        ["Maryam Ramezani", "Hamid R. Rabiee"],
        2024,
        "The DANI: fast inference",
      ),
    ).toBe("ramezani2024dani");
  });
});

describe("buildBibtex", () => {
  it("emits @article for journals with arXiv/doi url", () => {
    const bib = buildBibtex({
      title: "DANI",
      authors: ["Maryam Ramezani", "Hamid R. Rabiee"],
      year: 2024,
      venue: { name: "Scientific Reports", type: "journal" },
      links: [{ type: "doi", url: "https://doi.org/10.1/x" }],
    });
    expect(bib).toContain("@article{ramezani2024dani,");
    expect(bib).toContain("author = {Maryam Ramezani and Hamid R. Rabiee}");
    expect(bib).toContain("journal = {Scientific Reports}");
    expect(bib).toContain("doi = {10.1/x}");
  });
  it("emits @inproceedings for conferences and @misc for preprints", () => {
    const conf = buildBibtex({
      title: "X",
      authors: ["A B"],
      year: 2025,
      venue: { name: "KDD", type: "conference" },
      links: [],
    });
    expect(conf).toMatch(/^@inproceedings\{/);
    expect(conf).toContain("booktitle = {KDD}");
    const pre = buildBibtex({
      title: "X",
      authors: ["A B"],
      year: 2025,
      venue: { name: "arXiv", type: "preprint" },
      links: [{ type: "arxiv", url: "https://arxiv.org/abs/2501.00001" }],
    });
    expect(pre).toMatch(/^@misc\{/);
    expect(pre).toContain("eprint = {2501.00001}");
  });
});
```

```ts
// lib/content/people.test.ts
import { describe, expect, it } from "vitest";
import { groupPeople } from "./people";

const p = (name: string, role: any, extra = {}) => ({
  name,
  role,
  order: 100,
  ...extra,
});

describe("groupPeople", () => {
  it("orders groups director → alumni and omits empty ones", () => {
    const groups = groupPeople([
      p("S", "msc"),
      p("D", "director"),
      p("Z", "alumni", { endYear: 2024 }),
    ]);
    expect(groups.map((g) => g.role)).toEqual(["director", "msc", "alumni"]);
  });
  it("sorts current members by order then start year then name", () => {
    const [g] = groupPeople([
      p("B", "phd", { startYear: 2023 }),
      p("A", "phd", { startYear: 2023 }),
      p("C", "phd", { order: 1 }),
    ]);
    expect(g.people.map((x) => x.name)).toEqual(["C", "A", "B"]);
  });
  it("sorts alumni by most recent end year", () => {
    const [g] = groupPeople([
      p("Old", "alumni", { endYear: 2020 }),
      p("New", "alumni", { endYear: 2025 }),
    ]);
    expect(g.people.map((x) => x.name)).toEqual(["New", "Old"]);
  });
});
```

- [ ] Run → FAIL; implement; run → PASS. Commit `feat: bibtex and people grouping`.

### Task 5: Content graph

**Files:** Create `lib/content/graph.ts`, `lib/content/index.ts`, `lib/slug.ts`; Test `lib/content/graph.test.ts`, `lib/slug.test.ts`.

**Interfaces:**

- `slugify(value: string): string` (lowercase ASCII, `-` separators).
- Resolved types in `schema.ts`: `Person`, `PaperAuthor = { kind: "member"; person: Person } | { kind: "external"; name: string }`, `Paper`, `NewsItem`, `ResearchArea`, `Position`, `Tag`, `ContentGraph` with arrays + `peopleById, papersBySlug, newsBySlug, areasBySlug, tagsBySlug` maps.
- `buildGraph(raw: RawContent): ContentGraph` (pure) and `getGraph(): ContentGraph` (cached, reads fs).
- `index.ts`: `getAllPeople, getPerson, getPeopleGroups, getDirector, getAllPapers, getPaper, getFeaturedPapers, getRelatedPapers(paper, limit=3), getAllNews, getNewsItem, getAllAreas, getArea, getAllPositions, getOpenPositions, getCourses, getAllTags, getTag, getStats`.

- [ ] Failing tests with in-memory fixtures:

```ts
// lib/content/graph.test.ts
import { describe, expect, it } from "vitest";
import { buildGraph } from "./graph";
import type { RawContent } from "./read";
import {
  newsFrontmatterSchema,
  paperFrontmatterSchema,
  personFrontmatterSchema,
  positionFrontmatterSchema,
  researchFrontmatterSchema,
} from "./schema";

const doc = <T>(slug: string, frontmatter: T, body = "") => ({
  slug,
  file: `${slug}/index.mdx`,
  frontmatter,
  body,
});

function fixture(over: Partial<RawContent> = {}): RawContent {
  return {
    people: [
      doc(
        "ramezani",
        personFrontmatterSchema.parse({
          name: "Maryam Ramezani",
          role: "director",
        }),
      ),
      doc(
        "ali",
        personFrontmatterSchema.parse({ name: "Ali Student", role: "phd" }),
      ),
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
      doc(
        "p1",
        paperFrontmatterSchema.parse({
          title: "P1",
          abstract: "a",
          authors: ["ali", "External Person", "ramezani"],
          year: 2025,
          venue: { name: "VLDB", type: "conference" },
          tags: ["Text-to-SQL", "LLMs"],
          areas: ["text-to-sql"],
        }),
      ),
      doc(
        "p2",
        paperFrontmatterSchema.parse({
          title: "P2",
          abstract: "a",
          authors: ["ramezani"],
          year: 2023,
          venue: { name: "J", type: "journal" },
          tags: ["LLMs"],
        }),
      ),
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
      doc(
        "phd",
        positionFrontmatterSchema.parse({ title: "PhD", level: "phd" }),
      ),
    ],
    courses: [],
    ...over,
  };
}

describe("buildGraph", () => {
  it("resolves member and external authors in order", () => {
    const g = buildGraph(fixture());
    const p1 = g.papersBySlug.get("p1")!;
    expect(
      p1.authors.map((a) => (a.kind === "member" ? a.person.id : a.name)),
    ).toEqual(["ali", "External Person", "ramezani"]);
  });
  it("fills inverse relations", () => {
    const g = buildGraph(fixture());
    expect(g.peopleById.get("ramezani")!.papers.map((p) => p.slug)).toEqual([
      "p1",
      "p2",
    ]);
    expect(g.peopleById.get("ali")!.news.map((n) => n.slug)).toEqual(["n1"]);
    expect(g.areasBySlug.get("text-to-sql")!.papers.map((p) => p.slug)).toEqual(
      ["p1"],
    );
    expect(g.tagsBySlug.get("llms")!.count).toBe(3);
  });
  it("sorts papers newest first", () => {
    expect(buildGraph(fixture()).papers.map((p) => p.slug)).toEqual([
      "p1",
      "p2",
    ]);
  });
  it("fails on dangling references with the file named", () => {
    const bad = fixture({
      news: [
        doc(
          "n2",
          newsFrontmatterSchema.parse({
            title: "N",
            date: "2025-01-01",
            category: "event",
            papers: ["missing"],
          }),
        ),
      ],
    });
    expect(() => buildGraph(bad)).toThrow(/n2\/index\.mdx.*missing/s);
    const badArea = fixture({
      papers: [
        doc(
          "p3",
          paperFrontmatterSchema.parse({
            title: "P",
            abstract: "a",
            authors: ["ramezani"],
            year: 2024,
            venue: { name: "V", type: "journal" },
            areas: ["nope"],
          }),
        ),
      ],
    });
    expect(() => buildGraph(badArea)).toThrow(/p3\/index\.mdx.*nope/s);
  });
  it("fails when there is not exactly one director", () => {
    const none = fixture({
      people: [
        doc("ali", personFrontmatterSchema.parse({ name: "A", role: "phd" })),
      ],
      papers: [],
      news: [],
      research: [],
    });
    expect(() => buildGraph(none)).toThrow(/director/);
  });
  it("generates bibtex from resolved author names", () => {
    const p1 = buildGraph(fixture()).papersBySlug.get("p1")!;
    expect(p1.bibtex).toContain(
      "author = {Ali Student and External Person and Maryam Ramezani}",
    );
  });
});
```

```ts
// lib/slug.test.ts
import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Text-to-SQL & LLMs")).toBe("text-to-sql-llms");
    expect(slugify("  Graph   Mining ")).toBe("graph-mining");
  });
});
```

- [ ] Run → FAIL; implement; run → PASS. Commit `feat: content graph`.

### Task 6: MDX pipeline and content components

**Files:** Create `lib/mdx/options.ts`, `lib/mdx/components.tsx`, `components/mdx-content.tsx`, `components/content/{callout,figure}.tsx`, `lib/format.ts`, `lib/format.test.ts`.

**Interfaces:** `<MdxContent source baseUrl? />`; MDX globals `Callout (type: note|info|tip|warning|danger, title?)`, `Figure (src, alt, caption?)`; `formatDate("2025-05-01") → "May 1, 2025"`, `formatMonthYear → "May 2025"`.

- [ ] Test `formatDate`/`formatMonthYear` (UTC-safe). Implement copying Byte's plugin chain minus admonition/mermaid; images resolved via `baseUrl`. PASS. Commit `feat: mdx pipeline`.

### Task 7: Site config, SEO helpers, layout shell

**Files:** Create `lib/site.ts`, `lib/site.test.ts`, `lib/seo.tsx`, `components/layout/{header,footer,logo}.tsx`, `components/content/section-heading.tsx`, `components/motion/reveal.tsx`, `app/layout.tsx`, `app/not-found.tsx`.

**Interfaces:** `SITE` (`name, fullName, tagline, description, url, locale, email, phone, address[], mapUrl, department{name,url}, university{name,url}, github?`), `NAV_ITEMS: {href,label}[]` (Research, Papers, People, News, Teaching, Join Us), `assetPath(path: string): string`, `buildMetadata`, `JsonLd`, `organizationJsonLd`, `websiteJsonLd`, `personJsonLd`, `scholarlyArticleJsonLd`, `breadcrumbJsonLd`.

- [ ] Test `assetPath` with and without base path (stub env via `vi.stubEnv` + dynamic import). Implement. Header: DAISY mark + wordmark, nav, search button, theme toggle, mobile sheet. Footer: lab identity, Sharif logo + department line, nav, contact block, copyright. `pnpm typecheck` PASS. Commit `feat: layout shell`.

### Task 8: Build-time search

**Files:** Create `lib/search.ts`, `lib/search-docs.ts`, `scripts/build-search-index.ts`, `components/layout/search-dialog.tsx`; Test `lib/search.test.ts`, `lib/search-docs.test.ts`.

**Interfaces:**

- `type SearchKind = "paper" | "person" | "news" | "research" | "course" | "position" | "tag"`
- `interface SearchDoc { id: string; kind: SearchKind; url: string; title: string; description: string; related: string[]; tags: string[]; text: string }`
- `interface SearchHit { id: string; kind: SearchKind; url: string; title: string; description: string; related: string[]; score: number }`
- `createSearchIndex(docs: SearchDoc[]): MiniSearch<SearchDoc>`; `serializeSearchIndex(index): string`; `loadSearchIndex(json: string): MiniSearch<SearchDoc>`; `querySearchIndex(index, query: string, limit = 30): SearchHit[]`
- `collectSearchDocs(graph: ContentGraph): SearchDoc[]`

- [ ] Failing tests:

```ts
// lib/search.test.ts
import { describe, expect, it } from "vitest";
import {
  createSearchIndex,
  loadSearchIndex,
  querySearchIndex,
  serializeSearchIndex,
  type SearchDoc,
} from "./search";

const docs: SearchDoc[] = [
  {
    id: "paper:dani",
    kind: "paper",
    url: "/papers/dani/",
    title: "DANI: Fast Diffusion Aware Network Inference",
    description: "Network inference from cascades",
    related: ["Maryam Ramezani"],
    tags: ["Graph Mining"],
    text: "",
  },
  {
    id: "person:ramezani",
    kind: "person",
    url: "/people/ramezani/",
    title: "Maryam Ramezani",
    description: "Director",
    related: [],
    tags: ["Text-to-SQL"],
    text: "",
  },
  {
    id: "research:sql",
    kind: "research",
    url: "/research/text-to-sql/",
    title: "Text-to-SQL",
    description: "Natural language interfaces to databases",
    related: [],
    tags: [],
    text: "",
  },
];

describe("search", () => {
  it("matches by prefix", () => {
    const hits = querySearchIndex(createSearchIndex(docs), "diffus");
    expect(hits[0].id).toBe("paper:dani");
  });
  it("tolerates a typo", () => {
    expect(
      querySearchIndex(createSearchIndex(docs), "ramezny").map((h) => h.id),
    ).toContain("person:ramezani");
  });
  it("finds a paper through its related author", () => {
    expect(
      querySearchIndex(createSearchIndex(docs), "ramezani").map((h) => h.id),
    ).toContain("paper:dani");
  });
  it("ranks title matches above related matches", () => {
    expect(querySearchIndex(createSearchIndex(docs), "ramezani")[0].id).toBe(
      "person:ramezani",
    );
  });
  it("round-trips through JSON", () => {
    const loaded = loadSearchIndex(
      serializeSearchIndex(createSearchIndex(docs)),
    );
    expect(querySearchIndex(loaded, "sql")[0].url).toBe(
      "/research/text-to-sql/",
    );
  });
  it("returns nothing for blank queries", () => {
    expect(querySearchIndex(createSearchIndex(docs), "   ")).toEqual([]);
  });
});
```

`lib/search-docs.test.ts` builds the Task 5 fixture graph and asserts one doc per person/paper/news/area/position/tag, paper `related` contains author names, and ids are unique.

- [ ] Run → FAIL; implement (options: fields `title, description, related, tags, text`; storeFields `kind, url, title, description, related`; boost `title 5, tags 2, related 1.5, description 1.2`; `prefix: true`, `fuzzy: 0.2`, `combineWith: "AND"`); script writes `public/search-index.json`; dialog lazy-fetches `assetPath("/search-index.json")`, groups hits by kind, arrow/enter navigation, ⌘K / Ctrl+K and `/` shortcuts. PASS. Commit `feat: build-time search`.

### Task 9: People pages

**Files:** Create `components/cards/person-card.tsx`, `components/content/social-links.tsx`, `components/icons/linkedin.tsx`, `app/people/page.tsx`, `app/people/[id]/page.tsx`.

- [ ] `/people`: groups from `getPeopleGroups()`; director as a wide feature card; others in responsive grids; alumni compact list with years and next position.
- [ ] `/people/[id]`: `generateStaticParams`, `dynamicParams = false`, metadata + Person JSON-LD. Photo (initials fallback), name, title/role, email + phone + office, social icon buttons, interests chips, bio MDX, Education and Experience timelines (when present), Papers list, News.
- [ ] `pnpm typecheck` PASS. Commit `feat: people pages`.

### Task 10: Papers pages

**Files:** Create `components/cards/paper-card.tsx`, `components/content/{author-list,link-buttons,tag-list,bibtex-copy}.tsx`, `components/papers/paper-browser.tsx`, `app/papers/page.tsx`, `app/papers/[slug]/page.tsx`.

- [ ] `/papers`: server page passes a serializable summary list to `PaperBrowser` (client) with text filter, year/tag/member/venue-type selects, grouped by year, result count, reset.
- [ ] `/papers/[slug]`: cover, venue + year + status badges, author list (members linked, external plain), link buttons with type icons, abstract (serif), MDX body, tags, BibTeX block with copy, research areas, related papers; ScholarlyArticle JSON-LD.
- [ ] `pnpm typecheck` PASS. Commit `feat: papers pages`.

### Task 11: Research, news, tags, teaching, join

**Files:** Create `components/cards/{area-card,news-card}.tsx`, `app/research/page.tsx`, `app/research/[slug]/page.tsx`, `app/news/page.tsx`, `app/news/[slug]/page.tsx`, `app/tags/page.tsx`, `app/tags/[tag]/page.tsx`, `app/teaching/page.tsx`, `app/join/page.tsx`.

- [ ] Each detail route: `generateStaticParams`, `dynamicParams = false`, `buildMetadata`. Join page lists open positions first then closed, with application steps and a contact/location block from `SITE`. Teaching groups courses by level with offerings.
- [ ] `pnpm typecheck` PASS. Commit `feat: research, news, tags, teaching, join`.

### Task 12: Home page

**Files:** Create `components/sections/{hero,areas,featured-papers,latest-news,team,join-cta}.tsx`, `app/page.tsx`.

- [ ] Hero: large DAISY mark with slow orbit animation (reduced-motion safe), lab name + mission, CTA buttons, Sharif affiliation line. Sections consume `lib/content` helpers only. Organization + WebSite JSON-LD.
- [ ] Commit `feat: home page`.

### Task 13: Seed content

**Files:** Create `content/people/ramezani/{index.mdx,photo.png}`, sample `content/people/*`, `content/papers/*` (real publications from Scholar), `content/research/*`, sample `content/news/*`, `content/positions/*`, `content/data/courses.ts`.

- [ ] Director profile from spec facts; papers with abstracts/links from arXiv/publisher pages; generated SVG covers where none exist; sample entries marked `Sample` in names/titles.
- [ ] `pnpm test` PASS. Commit `content: seed lab content`.

### Task 14: SEO routes, asset sync, OG images

**Files:** Create `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `scripts/sync-assets.ts`, `scripts/generate-og.ts`.

- [ ] Port Byte scripts: sync copies non-document files beside `index.mdx`; OG renders default, paper, person, news cards (Instrument Sans woff, cream background, yellow accent bar, DAISY mark). Pages reference `/og/<kind>-<slug>.png`.
- [ ] `pnpm build` → `out/` produced with no errors. Commit `feat: seo routes and og images`.

### Task 15: Docs, deploy, verification

**Files:** Create `README.md`, `.github/workflows/deploy.yml`.

- [ ] README mirrors Byte's sections (principles, stack, quick start, scripts, env, repo map, content graph, authoring checklists for person/paper/news/area/position/course, theming — where to change `--brand`, search, deployment).
- [ ] Workflow: install, typecheck, lint, test, build with `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_BASE_PATH` from repo vars, `touch out/.nojekyll`, `actions/upload-pages-artifact` + `actions/deploy-pages`.
- [ ] Verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; serve `out/` and screenshot home, people, profile, papers, paper detail, search open, dark mode at desktop and 390px widths with Playwright; fix issues.
- [ ] Commit `docs: readme and deploy workflow`.
