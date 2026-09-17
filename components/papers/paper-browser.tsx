"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { LinkButtons } from "@/components/content/link-buttons";
import { Button } from "@/components/ui/button";
import type { PaperLink, VenueType } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Serializable shape of a paper for the client filter. The graph objects
 * themselves contain cycles, so the page passes this projection instead.
 */
export interface PaperSummary {
  slug: string;
  url: string;
  title: string;
  year: number;
  venue: { name: string; short?: string; type: VenueType };
  status: "published" | "accepted" | "under-review" | "preprint";
  authors: Array<{ name: string; url?: string }>;
  memberIds: string[];
  tags: string[];
  areas: Array<{ slug: string; title: string }>;
  links: PaperLink[];
}

export interface FilterOption {
  value: string;
  label: string;
}

const STATUS_LABELS = {
  published: null,
  accepted: "To appear",
  "under-review": "Under review",
  preprint: "Preprint",
} as const;

const VENUE_TYPE_OPTIONS: Array<{ value: VenueType | "all"; label: string }> = [
  { value: "all", label: "All types" },
  { value: "journal", label: "Journal" },
  { value: "conference", label: "Conference" },
  { value: "workshop", label: "Workshop" },
  { value: "preprint", label: "Preprint" },
  { value: "book", label: "Book chapter" },
];

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-input bg-card px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** One publication row, rendered from the serializable summary. */
function PaperRow({ paper }: { paper: PaperSummary }) {
  const status = STATUS_LABELS[paper.status];

  return (
    <article className="py-6">
      <h3 className="text-lg font-semibold leading-snug tracking-tight">
        <Link
          href={paper.url}
          className="transition-colors hover:text-primary-ink"
        >
          {paper.title}
        </Link>
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {paper.authors.map((author, index) => (
          <span key={index}>
            {index > 0 ? ", " : ""}
            {author.url ? (
              <Link
                href={author.url}
                className="font-medium text-foreground transition-colors hover:text-primary-ink"
              >
                {author.name}
              </Link>
            ) : (
              author.name
            )}
          </span>
        ))}
      </p>

      <p className="mt-1.5 text-sm text-muted-foreground">
        <span className="font-serif italic text-foreground/80">
          {paper.venue.name}
        </span>
        {status ? (
          <>
            <span className="mx-1.5 text-muted-foreground/50">|</span>
            <span className="rounded bg-primary-soft px-1.5 py-0.5 text-xs font-medium text-foreground">
              {status}
            </span>
          </>
        ) : null}
      </p>

      <LinkButtons links={paper.links} size="sm" className="mt-3" />
    </article>
  );
}

/**
 * The publication list with its filters.
 *
 * Filtering happens in the browser over data embedded at build time: the whole
 * bibliography is small enough that a query never needs a request.
 */
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
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [member, setMember] = useState("all");
  const [tag, setTag] = useState("all");
  const [area, setArea] = useState("all");
  const [venueType, setVenueType] = useState("all");

  const years = useMemo(
    () => [...new Set(papers.map((paper) => paper.year))].sort((a, b) => b - a),
    [papers],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return papers.filter((paper) => {
      if (year !== "all" && String(paper.year) !== year) return false;
      if (member !== "all" && !paper.memberIds.includes(member)) return false;
      if (tag !== "all" && !paper.tags.includes(tag)) return false;
      if (area !== "all" && !paper.areas.some((item) => item.slug === area))
        return false;
      if (venueType !== "all" && paper.venue.type !== venueType) return false;
      if (!needle) return true;
      const haystack = [
        paper.title,
        paper.venue.name,
        paper.venue.short ?? "",
        ...paper.authors.map((author) => author.name),
        ...paper.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [papers, query, year, member, tag, area, venueType]);

  const grouped = useMemo(() => {
    const byYear = new Map<number, PaperSummary[]>();
    for (const paper of filtered) {
      byYear.set(paper.year, [...(byYear.get(paper.year) ?? []), paper]);
    }
    return [...byYear.entries()].sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  const active =
    query.trim() !== "" ||
    [year, member, tag, area, venueType].some((value) => value !== "all");

  const reset = () => {
    setQuery("");
    setYear("all");
    setMember("all");
    setTag("all");
    setArea("all");
    setVenueType("all");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 border-b py-6">
        <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Search
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, author, venue…"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring"
          />
        </label>

        <Select
          label="Year"
          value={year}
          onChange={setYear}
          options={[
            { value: "all", label: "All years" },
            ...years.map((value) => ({
              value: String(value),
              label: String(value),
            })),
          ]}
        />
        <Select
          label="Author"
          value={member}
          onChange={setMember}
          options={[{ value: "all", label: "Anyone" }, ...members]}
        />
        <Select
          label="Research area"
          value={area}
          onChange={setArea}
          options={[{ value: "all", label: "All areas" }, ...areas]}
        />
        <Select
          label="Topic"
          value={tag}
          onChange={setTag}
          options={[{ value: "all", label: "All topics" }, ...tags]}
        />
        <Select
          label="Venue"
          value={venueType}
          onChange={setVenueType}
          options={VENUE_TYPE_OPTIONS}
        />

        {active ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="size-3.5" />
            Clear
          </Button>
        ) : null}
      </div>

      <p className="py-4 text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} of {papers.length} publications
      </p>

      {grouped.length === 0 ? (
        <p className="border-t py-16 text-center text-sm text-muted-foreground">
          No publications match these filters.
        </p>
      ) : null}

      <div className="divide-y">
        {grouped.map(([groupYear, groupPapers]) => (
          <section
            key={groupYear}
            className="grid gap-x-10 py-6 sm:grid-cols-[6rem_1fr]"
          >
            <h2 className="pt-6 font-mono text-2xl font-medium text-muted-foreground/70">
              {groupYear}
            </h2>
            <ul className={cn("divide-y")}>
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
  );
}
