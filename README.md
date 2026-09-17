# DAISY Lab

The website for **DAISY Lab — Data-Centric AI Systems**, a research lab in the
Department of Computer Engineering at Sharif University of Technology, directed
by Dr. Maryam Ramezani.

This is a **statically exported** Next.js app. There is no server runtime: the
build produces a directory of HTML/CSS/JS that any static host can serve.

---

## Principles

These constraints drive the architecture. Do not fight them.

| Constraint                        | Implication                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| Fully static (`output: "export"`) | No API routes, no ISR, no request-time data fetching                                           |
| Build-time content graph          | Relations, counts, the search index and OG images are computed in `prebuild` / module init     |
| English, LTR                      | `lang="en"`; formal, plain copy                                                                |
| One brand colour                  | `--brand` in `app/globals.css` drives the whole palette                                        |
| Content is data                   | Invalid frontmatter or a dangling reference **fails the build**, naming the file and the field |

---

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript (strict)
- **Tailwind CSS v4** + shadcn (`base-lyra`, Base UI primitives)
- **MDX** via `next-mdx-remote-client`, frontmatter via `gray-matter` + **Zod**
- **MiniSearch** for site search, serialized at build time
- **Shiki** (`rehype-pretty-code`) for code, **KaTeX** for math
- **Satori** + `@resvg/resvg-js` for Open Graph images
- **Vitest** for pure logic; **pnpm** as the package manager

---

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm build        # runs prebuild, then writes ./out
```

`prebuild` syncs co-located content assets into `public/`, builds the search
index, and regenerates the Open Graph images.

### Scripts

| Script              | What it does                              |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | Dev server                                |
| `pnpm build`        | Static export → `out/`                    |
| `pnpm test`         | Vitest                                    |
| `pnpm typecheck`    | `tsc --noEmit`                            |
| `pnpm lint`         | ESLint                                    |
| `pnpm prettier`     | Format the repo (`*.mdx` is ignored)      |
| `pnpm sync:assets`  | Copy content images into `public/content` |
| `pnpm build:search` | Rebuild `public/search-index.json`        |
| `pnpm generate:og`  | Regenerate Open Graph images              |

### Environment

| Variable                | Default                       | Purpose                                                                      |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`  | `https://daisy-lab.github.io` | Canonical origin for sitemap, canonical URLs, Open Graph and JSON-LD         |
| `NEXT_PUBLIC_BASE_PATH` | _(empty)_                     | Only when the site is served under a subpath, e.g. a GitHub **project** page |

---

## Repository map

```
app/                 Routes (App Router)
components/brand/    DAISY mark, Sharif emblem
components/cards/    Person, paper, news and research-area cards
components/content/  MDX and page building blocks
components/layout/   Header, footer, search dialog, theme controls
components/papers/   The client-side publication filter
components/sections/ Home page sections, including the hero research map
content/             Source of truth — MDX documents and typed data
lib/content/         Zod schemas, filesystem reader, resolved content graph
lib/search*.ts       Search index construction and querying
scripts/             Asset sync, search index, OG generation
public/              Static assets (fonts, images, synced content, OG, index)
```

---

## Content graph

`lib/content/graph.ts` loads `content/` **once per process** and returns a
frozen object graph with inverse relations already filled in:

- `person.papers`, `person.news`, `person.areas`
- `paper.members`, `paper.areas`, `area.papers`, `area.people`
- `tag.papers`, `tag.news`, `tag.count`

Every cross-reference is checked when the graph is built. An unknown person id
in a news item, an unknown paper slug, or an unknown research area fails the
build with the file and field named. Prefer fixing the graph over re-deriving
counts in UI code.

---

## Authoring

Every document is an `index.mdx` in its own folder, next to its assets:

```
content/papers/dani-network-inference/
  index.mdx
  cover.png
```

Relative asset paths (`./cover.png`) are copied to
`public/content/<collection>/<slug>/` by `pnpm sync:assets` and resolved
automatically.

### A new lab member — `content/people/<id>/index.mdx`

```yaml
---
name: Ali Example
role: phd # director | postdoc | phd | msc | bsc | alumni
title: PhD Student in Computer Engineering # shown under the name
image: ./photo.jpg
email: ali@example.edu
startYear: 2025
order: 100 # lower sorts first inside the group
summary: One line for cards and search results.
interests: [Text-to-SQL, Query Optimization]
socials:
  scholar: https://scholar.google.com/citations?user=…
  github: https://github.com/…
  # linkedin, x, orcid, dblp, researchgate, website, cv
education:
  - {
      degree: BSc,
      field: Computer Engineering,
      institution: Sharif,
      year: 2025,
    }
experience:
  - { role: Research Intern, organization: Example Lab, start: 2024, end: 2025 }
---
The biography goes here, as MDX.
```

Alumni add `degree` (`phd | msc | bsc | postdoc`), `endYear` and
`nextPosition`; those three fill the alumni table on `/people`.

The `id` is the folder name, and it is what papers and news reference.

**Exactly one person must have `role: director`** — the build enforces it.

### A new paper — `content/papers/<slug>/index.mdx`

```yaml
---
title: "Paper Title: With Subtitle"
abstract: >-
  The abstract, as published.
cover: ./cover.png # optional
authors: # ordered; an id links, anything else is an external co-author
  - maryam-ramezani
  - Some External Coauthor
year: 2025
date: "2025-04-14" # optional, for exact ordering and metadata
venue:
  name: ACM Transactions on Knowledge Discovery from Data
  short: ACM TKDD # optional
  type: journal # conference | journal | workshop | preprint | book
status: published # published | accepted | under-review | preprint
tags: [Graph Mining]
areas: [complex-networks] # research area folder names
featured: true # shown on the home page
links:
  - { type: doi, url: https://doi.org/… }
  - { type: arxiv, url: https://arxiv.org/abs/… }
  - { type: code, url: https://github.com/… }
# bibtex: |    # only when the generated entry is not good enough
---
Optional commentary about the paper, as MDX.
```

Link types: `paper`, `pdf`, `arxiv`, `doi`, `code`, `dataset`, `slides`,
`video`, `poster`, `project`, `publisher`.

BibTeX is generated from the metadata (entry type from the venue, arXiv eprint
and DOI when present). Set `bibtex:` to override it.

### A news item — `content/news/<slug>/index.mdx`

```yaml
---
title: Paper accepted at VLDB
date: "2026-05-01"
category: paper # paper | award | event | talk | defense | announcement
summary: One or two sentences.
people: [maryam-ramezani]
papers: [dani-network-inference]
tags: [Graph Mining]
---
```

A news item attached to a paper also appears on the profiles of that paper's
lab authors.

### A research area — `content/research/<slug>/index.mdx`

```yaml
---
title: Text-to-SQL and Data Interfaces
summary: One sentence, used on cards and the hero map.
order: 1
icon: database # database | cpu | server | bot | share-2 | shield-check | sparkles
people: [maryam-ramezani]
---
```

The first six areas, in `order`, become the nodes of the hero research map.

### An open position — `content/positions/<slug>/index.mdx`

```yaml
---
title: PhD students
level: phd # phd | msc | bsc | intern | postdoc
status: open # open | closed
deadline: "2026-01-15" # optional
summary: One sentence shown under the heading.
order: 1
---
```

### Courses — `content/data/courses.ts`

A typed array; each entry has `code`, `title`, `level`
(`undergraduate | graduate`), `description` and `offerings`
(`{ term, url? }`). Two courses must not share the same code **and** title.

### MDX components (global — no imports)

```mdx
<Callout type="tip" title="Note">
  Body text.
</Callout>

<Figure src="./img/diagram.png" alt="…" caption="…" />
```

Callout types: `note`, `info`, `tip`, `warning`, `danger`. Math: `$…$` /
`$$…$$`. Code fences are highlighted by Shiki.

---

## Replace the sample content

The repository ships with sample entries so every page has something to show.
Replace or delete them before publishing:

- `content/people/sample-*` — four placeholder members
- `content/news/sample-lab-opening`
- `content/data/courses.ts` — two placeholder courses
- `content/positions/*` — review the wording; it describes how to apply

---

## Theming

The whole palette derives from two values at the top of `app/globals.css`:

```css
:root {
  --brand: oklch(0.845 0.155 86); /* the daisy yellow from the logo */
  --brand-foreground: oklch(0.23 0.012 75); /* text placed on the brand */
}
```

Change `--brand` and the buttons, highlights, focus rings, the daisy's centre
and the Open Graph accent all follow. Keep `--brand-foreground` dark for a
light brand colour and light for a dark one.

Light (cream) is the default theme; visitors can switch to dark or follow their
system, and the choice is persisted. A blocking script in `<head>` applies the
stored theme before the first paint, so there is no flash.

The brand colour is used for fills, marks and underlines — never as body-text
colour, where a yellow would fail contrast on the cream ground.

---

## Search

`scripts/build-search-index.ts` walks the content graph and writes a serialized
**MiniSearch** index to `public/search-index.json` during `prebuild`. It covers
people, papers (including abstracts and bodies), news, research areas, courses,
positions and tags. Each document also stores the names of its neighbours in
the graph, so searching an author finds their papers.

The browser fetches that file the first time the search dialog opens (⌘K, Ctrl+K
or `/`), then queries it locally with prefix and fuzzy matching. Nothing is
indexed at request time.

---

## Deployment

```bash
pnpm build   # → out/
```

On every push to `main`, GitHub Actions runs typecheck, lint and tests, builds
the site and publishes `out/` to GitHub Pages.

Repository settings → Pages → **Source: GitHub Actions**.

| Repository variable     | When you need it                                                                 |
| ----------------------- | -------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`  | Always — set it to the final origin, e.g. `https://daisy.ce.sharif.edu`          |
| `NEXT_PUBLIC_BASE_PATH` | Only for a project page (`https://<org>.github.io/<repo>/`), set it to `/<repo>` |

For a custom domain, add a `CNAME` file to `public/` with the domain in it.

---

## License

Site content © DAISY Lab, Sharif University of Technology.
