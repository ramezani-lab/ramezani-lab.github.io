import { z } from "zod";

/**
 * ISO `YYYY-MM-DD`. YAML parses an unquoted date into a `Date`, so both forms
 * are accepted and normalized back to the string authors wrote.
 */
const isoDate = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be ISO format YYYY-MM-DD"),
);

const year = z.number().int().min(1900).max(2100);

// ---- People ----------------------------------------------------------------

export const ROLES = [
  "director",
  "postdoc",
  "phd",
  "msc",
  "bsc",
  "alumni",
] as const;
export type Role = (typeof ROLES)[number];

export const socialsSchema = z
  .object({
    scholar: z.url().optional(),
    scopus: z.url().optional(),
    researcherid: z.url().optional(),
    github: z.url().optional(),
    linkedin: z.url().optional(),
    x: z.url().optional(),
    orcid: z.url().optional(),
    dblp: z.url().optional(),
    researchgate: z.url().optional(),
    website: z.url().optional(),
    cv: z.string().min(1).optional(),
  })
  .strict()
  .default({});

export const educationSchema = z.object({
  degree: z.string().min(1),
  field: z.string().min(1),
  institution: z.string().min(1),
  year: z.union([year, z.string().min(1)]),
  note: z.string().optional(),
});

export const experienceSchema = z.object({
  role: z.string().min(1),
  organization: z.string().min(1),
  /** Omitted when the exact years are not documented. */
  start: z.union([year, z.string().min(1)]).optional(),
  end: z.union([year, z.string().min(1)]).optional(),
  description: z.string().optional(),
});

export const personFrontmatterSchema = z.object({
  name: z.string().min(1),
  role: z.enum(ROLES),
  /** Position shown under the name, e.g. "Assistant Professor". */
  title: z.string().optional(),
  image: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  office: z.string().optional(),
  startYear: year.optional(),
  endYear: year.optional(),
  /** Lower sorts first within a role group. */
  order: z.number().int().default(100),
  /** One-line summary for cards and search. */
  summary: z.string().default(""),
  interests: z.array(z.string().min(1)).default([]),
  socials: socialsSchema,
  education: z.array(educationSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  /** Alumni only: the programme completed in the lab. */
  degree: z.enum(["postdoc", "phd", "msc", "bsc"]).optional(),
  /** Alumni only: where they went next. */
  nextPosition: z.string().optional(),
});

// ---- Papers ----------------------------------------------------------------

export const VENUE_TYPES = [
  "conference",
  "journal",
  "workshop",
  "preprint",
  "book",
] as const;
export type VenueType = (typeof VENUE_TYPES)[number];

export const PAPER_STATUSES = [
  "published",
  "accepted",
  "under-review",
  "preprint",
] as const;
export type PaperStatus = (typeof PAPER_STATUSES)[number];

export const LINK_TYPES = [
  "paper",
  "pdf",
  "arxiv",
  "doi",
  "code",
  "dataset",
  "slides",
  "video",
  "poster",
  "project",
  "publisher",
] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export const paperLinkSchema = z.object({
  type: z.enum(LINK_TYPES),
  url: z.url(),
  label: z.string().optional(),
});

export const venueSchema = z.object({
  name: z.string().min(1),
  short: z.string().optional(),
  type: z.enum(VENUE_TYPES),
});

export const paperFrontmatterSchema = z.object({
  title: z.string().min(1),
  abstract: z.string().min(1),
  cover: z.string().optional(),
  /** Ordered. A person id links to that member; anything else is a name. */
  authors: z
    .array(z.string().min(1))
    .min(1, "a paper needs at least one author"),
  year,
  date: isoDate.optional(),
  venue: venueSchema,
  status: z.enum(PAPER_STATUSES).default("published"),
  tags: z.array(z.string().min(1)).default([]),
  areas: z.array(z.string().min(1)).default([]),
  links: z.array(paperLinkSchema).default([]),
  featured: z.boolean().default(false),
  bibtex: z.string().optional(),
});

// ---- News ------------------------------------------------------------------

export const NEWS_CATEGORIES = [
  "paper",
  "award",
  "event",
  "talk",
  "defense",
  "announcement",
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const newsFrontmatterSchema = z.object({
  title: z.string().min(1),
  date: isoDate,
  category: z.enum(NEWS_CATEGORIES),
  summary: z.string().default(""),
  cover: z.string().optional(),
  people: z.array(z.string().min(1)).default([]),
  papers: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
});

// ---- Research areas --------------------------------------------------------

export const researchFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  order: z.number().int().default(0),
  /** A lucide icon name, mapped in `components/content/area-icon.tsx`. */
  icon: z.string().default("sparkles"),
  people: z.array(z.string().min(1)).default([]),
});

// ---- Positions -------------------------------------------------------------

export const POSITION_LEVELS = [
  "phd",
  "msc",
  "bsc",
  "intern",
  "postdoc",
] as const;
export type PositionLevel = (typeof POSITION_LEVELS)[number];

export const positionFrontmatterSchema = z.object({
  title: z.string().min(1),
  level: z.enum(POSITION_LEVELS),
  status: z.enum(["open", "closed"]).default("open"),
  deadline: isoDate.optional(),
  summary: z.string().default(""),
  order: z.number().int().default(0),
});

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

// ---- Courses ---------------------------------------------------------------

export const courseSchema = z.object({
  code: z.string().optional(),
  title: z.string().min(1),
  level: z.enum(["undergraduate", "graduate"]),
  description: z.string().default(""),
  offerings: z
    .array(z.object({ term: z.string().min(1), url: z.url().optional() }))
    .default([]),
});

export type Socials = z.infer<typeof socialsSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type PersonFrontmatter = z.infer<typeof personFrontmatterSchema>;
export type PaperLink = z.infer<typeof paperLinkSchema>;
export type Venue = z.infer<typeof venueSchema>;
export type PaperFrontmatter = z.infer<typeof paperFrontmatterSchema>;
export type NewsFrontmatter = z.infer<typeof newsFrontmatterSchema>;
export type ResearchFrontmatter = z.infer<typeof researchFrontmatterSchema>;
export type PositionFrontmatter = z.infer<typeof positionFrontmatterSchema>;
export type GalleryPhotoInput = z.input<typeof galleryPhotoSchema>;
export type GalleryPhotoData = z.infer<typeof galleryPhotoSchema>;
export type CourseInput = z.input<typeof courseSchema>;
export type Course = z.infer<typeof courseSchema>;

// ---- Resolved graph --------------------------------------------------------

/**
 * Resolved graph types. Relations are populated once at build time, so
 * `person.papers` and `area.people` are real arrays, not lookups.
 */
export interface Person extends Omit<PersonFrontmatter, "image"> {
  id: string;
  url: string;
  image?: string;
  body: string;
  papers: Paper[];
  news: NewsItem[];
  areas: ResearchArea[];
}

export type PaperAuthor =
  { kind: "member"; person: Person } | { kind: "external"; name: string };

export interface Paper {
  slug: string;
  url: string;
  title: string;
  abstract: string;
  cover?: string;
  authors: PaperAuthor[];
  /** Lab members among the authors, in author order. */
  members: Person[];
  year: number;
  date?: string;
  venue: Venue;
  status: PaperStatus;
  tags: string[];
  areas: ResearchArea[];
  links: PaperLink[];
  featured: boolean;
  bibtex: string;
  body: string;
}

export interface NewsItem {
  slug: string;
  url: string;
  title: string;
  date: string;
  category: NewsCategory;
  summary: string;
  cover?: string;
  people: Person[];
  papers: Paper[];
  photos: GalleryPhoto[];
  tags: string[];
  body: string;
}

/** A photo with its file-derived id and generated sizes, before graph linking. */
export interface RawPhoto extends GalleryPhotoData, PhotoManifestEntry {
  id: string;
}

export interface GalleryPhoto extends Omit<RawPhoto, "news"> {
  /** Deep link that opens this photo in the lightbox. */
  url: string;
  news?: NewsItem;
}

export interface ResearchArea {
  slug: string;
  url: string;
  title: string;
  summary: string;
  order: number;
  icon: string;
  people: Person[];
  papers: Paper[];
  body: string;
}

export interface Position extends PositionFrontmatter {
  slug: string;
  /** Anchor on the join page; positions have no page of their own. */
  url: string;
  body: string;
}

export interface Tag {
  name: string;
  slug: string;
  url: string;
  papers: Paper[];
  news: NewsItem[];
  photos: GalleryPhoto[];
  count: number;
}

export interface ContentGraph {
  people: Person[];
  peopleById: Map<string, Person>;
  director: Person;
  papers: Paper[];
  papersBySlug: Map<string, Paper>;
  news: NewsItem[];
  newsBySlug: Map<string, NewsItem>;
  photos: GalleryPhoto[];
  photosById: Map<string, GalleryPhoto>;
  areas: ResearchArea[];
  areasBySlug: Map<string, ResearchArea>;
  positions: Position[];
  courses: Course[];
  tags: Tag[];
  tagsBySlug: Map<string, Tag>;
}
