"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type MiniSearch from "minisearch";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  loadSearchIndex,
  querySearchIndex,
  SEARCH_KINDS,
  type SearchDoc,
  type SearchHit,
  type SearchKind,
} from "@/lib/search";
import { assetPath } from "@/lib/site";
import { cn } from "@/lib/utils";

const GROUP_LABELS: Record<SearchKind, string> = {
  research: "Research",
  paper: "Publications",
  person: "People",
  news: "News",
  course: "Teaching",
  position: "Open positions",
  tag: "Topics",
};

/** Fetched once per session and shared across every dialog mount. */
let indexCache: MiniSearch<SearchDoc> | null = null;
let indexRequest: Promise<MiniSearch<SearchDoc> | null> | null = null;

function loadIndex(): Promise<MiniSearch<SearchDoc> | null> {
  if (indexCache) return Promise.resolve(indexCache);
  indexRequest ??= fetch(assetPath("/search-index.json"))
    .then((response) => (response.ok ? response.text() : null))
    .then((json) => {
      indexCache = json ? loadSearchIndex(json) : null;
      return indexCache;
    })
    .catch(() => null);
  return indexRequest;
}

/**
 * Site-wide search over the prebuilt index.
 *
 * Results are real links, so opening one in a new tab works. Built on the
 * plain Dialog rather than cmdk, which conflicts with Base UI here.
 */
export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<MiniSearch<SearchDoc> | null>(indexCache);
  const [ready, setReady] = useState(indexCache !== null);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || ready) return;
    let cancelled = false;
    void loadIndex().then((loaded) => {
      if (cancelled) return;
      setIndex(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, ready]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const groups = useMemo(() => {
    const hits = index ? querySearchIndex(index, query, 24) : [];
    const byKind = new Map<SearchKind, SearchHit[]>();
    for (const hit of hits) {
      byKind.set(hit.kind, [...(byKind.get(hit.kind) ?? []), hit]);
    }
    return SEARCH_KINDS.filter((kind) => byKind.has(kind)).map((kind) => ({
      kind,
      hits: byKind.get(kind)!,
    }));
  }, [query, index]);

  const flat = useMemo(() => groups.flatMap((group) => group.hits), [groups]);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, flat.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      listRef.current
        ?.querySelector<HTMLAnchorElement>('[data-active="true"]')
        ?.click();
    }
  };

  const positions = new Map(flat.map((hit, index) => [hit.id, index]));

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground sm:w-56 sm:justify-start"
        aria-label="Search the site"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="ms-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] sm:inline">
          ⌘K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="top-[10vh] w-full max-w-xl translate-y-0 gap-0 p-0 sm:max-w-xl"
          showCloseButton={false}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Search publications, people, research areas and news
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search publications, people, topics…"
              aria-label="Search"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div
            ref={listRef}
            className="scroll-subtle max-h-[60vh] overflow-y-auto p-2"
          >
            {!ready ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Loading the index…
              </p>
            ) : null}

            {ready && !query.trim() ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Type a paper title, a person, a venue or a topic.
              </p>
            ) : null}

            {ready && query.trim() && flat.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No matches for “{query.trim()}”.
              </p>
            ) : null}

            <ul role="listbox" aria-label="Search results">
              {groups.map((group) => (
                <li key={group.kind}>
                  <p className="px-3 pb-1 pt-3 text-xs font-semibold text-muted-foreground">
                    {GROUP_LABELS[group.kind]}
                  </p>
                  <ul>
                    {group.hits.map((hit) => {
                      const position = positions.get(hit.id) ?? 0;
                      const isActive = position === active;
                      return (
                        <li key={hit.id}>
                          <Link
                            href={hit.url}
                            role="option"
                            aria-selected={isActive}
                            data-active={isActive}
                            onClick={close}
                            onMouseMove={() => setActive(position)}
                            className={cn(
                              "flex flex-col gap-0.5 rounded-md px-3 py-2 no-underline transition-colors",
                              isActive ? "bg-primary-soft" : "hover:bg-muted",
                            )}
                          >
                            <span className="text-sm font-medium text-foreground">
                              {hit.title}
                            </span>
                            {hit.description ? (
                              <span className="line-clamp-1 text-xs text-muted-foreground">
                                {hit.description}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
