# DAISY Lab Website — Design

Date: 2026-09-17
Status: approved

## Purpose

Official English website for **DAISY Lab — Data-Centric AI Systems**, a research
lab in the Department of Computer Engineering, Sharif University of Technology,
directed by Dr. Maryam Ramezani. Formal, modern, professional.

## Constraints

| Constraint                                         | Implication                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Same stack and folder layout as `byte-new-website` | Next.js 16 App Router, React 19, TS strict, Tailwind v4 + shadcn (base-lyra, LTR), MDX via `next-mdx-remote-client`, gray-matter + Zod, Shiki, KaTeX, Vitest, pnpm |
| Fully static (`output: "export"`)                  | No API routes; everything derived at build time                                                                                                                    |
| Build-time content graph                           | Relations, counts, search index, OG images computed in `prebuild` / module init                                                                                    |
| English only, LTR                                  | `lang="en"`; formal copy                                                                                                                                           |
| Primary colour lives in `app/globals.css`          | One `--primary` per theme; derived tints via `color-mix()`                                                                                                         |
| Default theme is light (cream, from the logo)      | Toggle offers light / dark / system                                                                                                                                |
| Deploy: GitHub Pages via Actions                   | Same workflow shape as Byte; domain configurable in `lib/site.ts`                                                                                                  |

## Content model (`content/`)

All MDX documents are `index.mdx` beside their assets; `scripts/sync-assets.ts`
copies assets to `public/content/`.

### People — `content/people/<id>/index.mdx`

Frontmatter: `name`, `role` (`director | postdoc | phd | msc | bsc | alumni`),
`title` (display position, e.g. "Assistant Professor"), `image`, `email`,
`startYear`, `endYear`, `order`, `interests[]`, `socials`
(`scholar, github, linkedin, x, orcid, dblp, researchgate, website, cv`),
`office`, `phone`, `education[]` (`degree, field, institution, year`),
`experience[]` (`role, organization, start, end`), alumni-only `degree`
(what they studied here) and `nextPosition`. Body = biography (MDX).

### Papers — `content/papers/<slug>/index.mdx`

Frontmatter: `title`, `abstract`, `cover`, `authors[]` (ordered; a string that
matches a person id links to that member, anything else is an external
co-author name), `year`, `date`, `venue` (`name`, `short`, `type`:
`conference | journal | workshop | preprint | book`), `status`
(`published | accepted | under-review | preprint`), `tags[]`, `areas[]`
(research area slugs), `links[]` (`type`: `paper | pdf | arxiv | doi | code |
dataset | slides | video | poster | project | publisher`; `url`; optional
`label`), `featured`, optional `bibtex` (generated when absent). Body = MDX.

### News — `content/news/<slug>/index.mdx`

`title`, `date`, `category` (`paper | award | event | talk | defense |
announcement`), `summary`, `cover`, `people[]`, `papers[]`, `tags[]`.

### Research areas — `content/research/<slug>/index.mdx`

`title`, `summary`, `order`, `icon` (lucide name), `people[]`. Papers attach via
paper `areas`.

### Positions — `content/positions/<slug>/index.mdx`

`title`, `level` (`phd | msc | bsc | intern | postdoc`), `status`
(`open | closed`), `deadline`, `summary`.

### Courses — `content/data/courses.ts`

`code`, `title`, `level` (`undergraduate | graduate`), `description`,
`offerings[]` (`term`, `url`).

## Content graph (`lib/content/graph.ts`)

Built once per process, frozen. Resolves and validates references (unknown
person id in news/research/position, unknown paper slug in news, unknown area
in a paper → build fails with file + field). Inverse relations:
`person.papers`, `person.news`, `area.papers`, `area.people`, `tag.papers`,
`tag.news`, related papers (shared tags/areas), counts. People grouped by role
in a fixed order: Director, Postdoctoral Researchers, PhD Students, MSc
Students, Undergraduate Researchers, Alumni.

## Routes (`app/`)

- `/` — hero (logo mark, mission), research areas, featured & recent papers,
  latest news, director + team preview, join CTA.
- `/people`, `/people/[id]` — grouped roster; profile with contacts & socials,
  bio, CV (education, experience), interests, papers, news.
- `/papers`, `/papers/[slug]` — client-side filters (year, tag, member, venue
  type, text) over build-time data grouped by year; detail with cover, authors,
  venue/status, link buttons, abstract, MDX body, copy-BibTeX, related papers.
- `/research`, `/research/[slug]`.
- `/news`, `/news/[slug]`.
- `/tags`, `/tags/[tag]`.
- `/teaching`.
- `/join` — open positions, how to apply, contact & location.
- `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, 404.

## Search

`scripts/build-search-index.ts` (prebuild) builds a **MiniSearch** index from the
graph over people, papers (title, abstract, authors, tags, venue, body text),
news, research areas, courses, positions and tags, and writes the serialized
index to `public/search-index.json`. Each stored document carries `kind`, `url`,
`title`, `description` and `related` labels (e.g. a paper's author names) so
results show their neighbourhood in the graph. The ⌘K dialog lazy-loads the
index on open; prefix + fuzzy matching, title boost, results grouped by kind,
keyboard navigation.

## Visual design

- Palette from the logo. Light: cream background, warm charcoal ink, daisy
  yellow `--primary` with dark `--primary-foreground`. Dark: warm charcoal.
  Derived tokens (`--primary-soft`, highlight, ring) via `color-mix()` so only
  `--primary` needs changing.
- Primary is used for fills, marks and underlines, never as body-text colour
  (yellow text fails contrast on cream).
- DAISY mark redrawn as an SVG component (orbit arc, two nodes, eight-petal
  daisy, yellow centre) with `currentColor` strokes so it works in both themes.
  Sharif University logo in header context and footer.
- Type: grotesk sans for UI/headings, serif for abstracts and long prose, mono
  for BibTeX and metadata; all self-hosted in `public/fonts/`.
- Motion: restrained reveal-on-scroll and hover states with `motion`; honours
  `prefers-reduced-motion`.

## SEO

`buildMetadata` per page, JSON-LD (`Organization`, `WebSite`, `Person`,
`ScholarlyArticle`, `BreadcrumbList`), build-time OG images with Satori.

## Testing

Vitest for pure logic: schemas, graph relations and reference validation, role
grouping, BibTeX generation, search index build/query, slug helpers.

## Seed content

Real: Dr. Maryam Ramezani's profile (Assistant Professor, Software Group, CE
Sharif; PhD CE Sharif 2023, MSc IT Sharif 2014, BSc IT Sharif 2012; Room 821;
maryam.ramezani@sharif.edu; +98 21 6616 6654; interests ML4Sys, Sys4ML,
Database Optimization, Text-to-SQL, AI Agent Systems, Complex & Social
Networks) and her publications from Google Scholar with public links. Sample
(clearly marked, to be replaced): students, courses, news, positions.

## Out of scope (v1)

RSS feed, datasets/code page, reading group schedule, automatic citation
counts.
