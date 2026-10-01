"use client";

import { useState, type ReactNode } from "react";
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
function Group({ label, children }: { label: string; children: ReactNode }) {
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
      className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto"
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
