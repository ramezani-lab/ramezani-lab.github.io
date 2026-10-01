"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { LinkButtons } from "@/components/content/link-buttons";
import type { PaperLink, VenueType } from "@/lib/content";
import {
  EMPTY_CRITERIA,
  filterPapers,
  groupByYear,
  type PaperCriteria,
} from "@/lib/content/papers-filter";

import { PaperFilters } from "./paper-filters";

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
