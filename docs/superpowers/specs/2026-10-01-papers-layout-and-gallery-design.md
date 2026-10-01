# Publications layout and photo gallery — design

**Date:** 2026-10-01
**Status:** approved design, pending implementation plan

## Context

The site is live on `main`. Two changes were requested:

1. `/papers` does not read well. The filters sit in a wrapping horizontal bar
   above the list, which collapses untidily at medium widths and scrolls out of
   view as soon as the reader moves down the bibliography.
2. The lab has no way to publish photographs. It wants a gallery where each
   photo carries its own caption, date and further details.

## Goals

- `/papers`: filters in a sticky right-hand rail, the bibliography in a single
  left column, both usable on a phone.
- A `Gallery` section: a flat, date-ordered stream of photographs, each with a
  caption and date (required) and an optional description, location, topic tags
  and link to a news item.
- Photographs served at a sane weight despite the static export.
- Photos reachable from site search and linkable individually.

## Non-goals

- Albums or event grouping. The gallery is a flat stream (decided).
- A route per photo. The lightbox carries the detail view (decided).
- Tagging people in photos. Not requested; the schema can gain it later.
- Reading dates or locations from EXIF. Both are authored.
- Extending the image pipeline to paper covers or portraits. Later, if wanted.
- Uploading photos through a UI. Photos arrive as files in the repository.

---

## Part 1 — `/papers` two-column layout

### Layout

`PaperBrowser` becomes a two-column grid below `lg`:

```
lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-x-12
```

The filter panel is **first in the DOM** and placed in the second column
(`lg:col-start-2 lg:row-start-1`); the list is placed in the first
(`lg:col-start-1 lg:row-start-1`). Controls therefore precede content for
keyboard and screen-reader users while appearing on the right visually, and on a
phone the filters sit naturally above the list without any order juggling.

The rail is `lg:sticky lg:top-24 lg:self-start`, with
`lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto` so a long filter list scrolls
inside the rail rather than pushing the page.

On screens below `lg` the panel collapses behind a `Filters` button that shows
the number of active filters; `lg:` forces it open and hides the button.

### Filters

A full column replaces the six cramped `<select>` elements with stacked,
labelled groups:

| Group         | Control                                                          |
| ------------- | ---------------------------------------------------------------- |
| Search        | text input (unchanged behaviour)                                 |
| Year          | row of chips, newest first                                       |
| Venue         | row of chips (journal / conference / workshop / preprint / book) |
| Research area | vertical list of radio rows with counts                          |
| Author        | vertical list of radio rows                                      |
| Topic         | vertical list, capped at eight with a `Show all` toggle          |

Selection stays **single-value per group**, exactly as today — the filter logic
and the URL-less state model do not change. A `Clear` button appears at the top
of the rail while any filter is active. The result count ("12 of 34
publications") moves to the top of the list column, above the first year group.

### Extracted logic

`filterPapers(papers, criteria)` and `groupByYear(papers)` move out of the
component into `lib/content/papers-filter.ts` as pure functions over
`PaperSummary`, and gain unit tests. The component keeps the state and the
markup.

### Files

- `components/papers/paper-browser.tsx` — rewritten layout; keeps `PaperRow`.
- `components/papers/paper-filters.tsx` — new; the rail and its controls.
- `lib/content/papers-filter.ts` + `.test.ts` — new; pure filtering/grouping.
- `app/papers/page.tsx` — unchanged except widening the container if needed.

---

## Part 2 — Gallery

### Why a data file rather than MDX documents

Every field a photo needs is a scalar; none of them wants an MDX body. One
typed array keeps authoring to "drop the file in a folder, add four lines", and
makes the whole gallery visible in a single diff. This follows the existing
`content/data/courses.ts` precedent, so the reader needs no new document
walking.

### Content

```
content/gallery/images/2026-05-12-thesis-defense.jpg   # the source files
content/data/gallery.ts                                # the metadata
```

```ts
export const GALLERY: GalleryPhotoInput[] = [
  {
    image: "2026-05-12-thesis-defense.jpg",
    caption: "Ali Example defends his MSc thesis",
    date: "2026-05-12",
    description: "Optional longer paragraph shown in the lightbox.",
    location: "Department of Computer Engineering, Sharif University",
    tags: ["Graph Mining"],
    news: "some-news-slug",
  },
];
```

### Schema — `lib/content/schema.ts`

```ts
export const galleryPhotoSchema = z.object({
  /** File name inside content/gallery/images/. */
  image: z.string().min(1),
  caption: z.string().min(1),
  date: isoDate,
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string().min(1)).default([]),
  /** Slug of a related news item; validated against the graph. */
  news: z.string().min(1).optional(),
});
```

`id` is derived, not authored: `slugify(basename(image, extension))`. The
filesystem already guarantees one entry per file name, and the id stays stable
when a caption is reworded. `buildGraph` rejects two entries whose ids collide
after slugification, in the same style as the course check.

### Resolved type

```ts
export interface GalleryPhoto {
  id: string;
  /** Deep link that opens this photo in the lightbox. */
  url: string; // /gallery#<id>
  caption: string;
  date: string;
  description?: string;
  location?: string;
  tags: string[];
  news?: NewsItem;
  /** Intrinsic size of the source image, for a grid that never reflows. */
  width: number;
  height: number;
  /** Generated derivatives, site-relative. */
  src: string; // 1600w webp
  thumb: string; // 800w webp
  full: string; // longest edge capped at 2400, webp
}
```

`ContentGraph` gains `photos: GalleryPhoto[]` (newest first) and
`photosById: Map<string, GalleryPhoto>`. `NewsItem` gains
`photos: GalleryPhoto[]`, and `Tag` gains `photos: GalleryPhoto[]`, both filled
as inverse relations, with `tag.count` including photos. A `news` slug that
matches nothing fails the build through the existing `referenceError()`.

### Image pipeline — `scripts/build-gallery-images.ts`

Runs in `prebuild` and `predev`, after `sync-assets` and before
`build-search-index`:

1. Read every file in `content/gallery/images/`.
2. With **sharp** (new `devDependency`; already listed in
   `pnpm.onlyBuiltDependencies`), `.rotate()` to honour EXIF orientation, then
   write to `public/content/gallery/`:
   - `<id>-800.webp`, `<id>-1600.webp` — grid, as a `srcset`
   - `<id>.webp` — lightbox, longest edge capped at 2400
     A width is skipped when the source is narrower; nothing is ever upscaled.
3. Write `public/content/gallery/manifest.json`: `id → { width, height }` plus
   the generated file names.
4. Skip any photo whose outputs are newer than the source, so the dev loop stays
   fast.

`lib/content/gallery.ts` reads that manifest at build time and merges it with
the data file. A photo with no manifest entry fails the build with
`run \`pnpm build:gallery\``, naming the file — the same contract as every other
content error. New script: `"build:gallery"`.

Generated output lands under `public/content/`, which `.gitignore` already
excludes, so the repository carries only the originals.

The pure parts — `thumbnailPlan(width)` (which widths to emit) and the
id/manifest merge — live in `lib/images.ts` and `lib/content/gallery.ts` and are
unit-tested; sharp itself is not tested.

### Pages and components

`app/gallery/page.tsx` (server): page header, then `<GalleryGrid>` with a
serializable projection of the photos. When the gallery is empty it renders a
single line explaining that photographs will appear here.

- `components/gallery/gallery-grid.tsx` (client) — CSS-columns masonry
  (`columns-1 sm:columns-2 lg:columns-3`, `break-inside-avoid`). Each tile is a
  button wrapping an `<img>` with `srcset`/`sizes`, explicit `width`/`height`
  from the manifest, `loading="lazy"` and `decoding="async"`. Caption and date
  sit under the image, so the page is informative without opening anything.
  Above the grid: year chips and tag chips (single-select, same idiom as the
  publications rail).
- `components/gallery/gallery-lightbox.tsx` (client) — built on
  `components/ui/dialog.tsx` (Base UI already gives focus trapping, `Esc` and a
  scroll lock). Shows the full image, caption, date, location, description, tag
  links and a link to the related news item, plus a `3 / 24` counter.
  `ArrowLeft`/`ArrowRight` move through the **filtered** set. Opening a photo
  writes `#<id>` with `history.replaceState`; on mount the component reads
  `location.hash` and opens that photo, which is what makes a search result or a
  pasted link land on the right image.

Both files stay under ~150 lines; the filter state lives in the grid and is
passed down.

### Search

`SEARCH_KINDS` gains `"photo"`, `GROUP_LABELS` gains `photo: "Gallery"`, and
`collectSearchDocs` emits one document per photo: id `photo:<id>`, url
`/gallery#<id>`, title the caption, description the formatted date and location,
`tags` the photo's tags, `text` the description. `related` carries the linked
news item's title.

### Navigation, sitemap, Open Graph

- `lib/site.ts`: `NAV_ITEMS` gains `{ href: "/gallery", label: "Gallery" }`
  after News. Because an empty gallery should not advertise itself, the header
  takes its items from `getNavItems()`, which drops `/gallery` while
  `graph.photos` is empty. Seven items still fit the `lg` navigation bar; below
  `lg` the existing sheet handles them.
- `app/sitemap.ts`: a `/gallery` entry (priority 0.5, weekly) when the gallery
  is not empty.
- `scripts/generate-og.ts`: one `gallery.png` card using the newest photo as its
  image, skipped when there are no photos.

### Seed content

The lab's photographs are not available, and none will be invented. The gallery
ships with an empty `GALLERY` array and a `.gitkeep` in the images folder.
Implementation verifies the grid and lightbox against temporary placeholder
images that are deleted before commit.

### Documentation

`README.md` gains a `Gallery` subsection under **Authoring**: where the files
go, the field list, which fields are required, and the `pnpm build:gallery`
step.

---

## Testing

| Area                                | Test                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `lib/content/papers-filter.test.ts` | each filter, filters combined, free-text match across title/author/venue, grouping newest-first |
| `lib/content/gallery.test.ts`       | id derivation, duplicate-id error, newest-first order, dangling `news` slug, missing manifest   |
| `lib/images.test.ts`                | `thumbnailPlan` never upscales and always emits the smallest width                              |
| `lib/content/graph.test.ts`         | photo attaches to its news item and to its tags; `tag.count` includes photos                    |
| `lib/search-docs.test.ts`           | one document per photo, with the `/gallery#<id>` url                                            |

Visual verification follows the existing route: build, serve `out/`, drive the
pages with the local Playwright Chromium, and check both themes at phone and
desktop widths.

## Risks

- **sharp install.** A native dependency; the GitHub Actions runner is Linux x64,
  which sharp ships prebuilt binaries for, and `onlyBuiltDependencies` already
  permits its build script.
- **Build time.** Encoding is cached on mtime, so only new photos cost anything.
  A one-off cold build of a hundred photos is seconds, not minutes.
- **Seven navigation items** crowd the `lg` bar. Checked visually; the gallery
  item is hidden while the gallery is empty, so nothing regresses today.

## Out of scope, worth revisiting

Albums, people tagged in photos, a per-photo route with its own Open Graph
card, and reusing the pipeline for paper covers and portraits.
