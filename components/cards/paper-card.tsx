import Link from "next/link";

import { AuthorList } from "@/components/content/author-list";
import { LinkButtons } from "@/components/content/link-buttons";
import type { Paper } from "@/lib/content";
import { assetPath } from "@/lib/site";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  published: null,
  accepted: "To appear",
  "under-review": "Under review",
  preprint: "Preprint",
} as const;

/**
 * One publication in a list: the shape a reader expects from a CV, with the
 * venue and the resource links doing the work a card's chrome would otherwise.
 */
export function PaperCard({
  paper,
  highlight,
  showLinks = true,
  showCover = false,
}: {
  paper: Paper;
  /** Person id to mark in the author list. */
  highlight?: string;
  showLinks?: boolean;
  showCover?: boolean;
}) {
  const status = STATUS_LABELS[paper.status];

  return (
    <article className={cn("flex gap-5 py-6", showCover ? "items-start" : null)}>
      {showCover && paper.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetPath(paper.cover)}
          alt=""
          loading="lazy"
          className="hidden w-40 shrink-0 rounded-lg border bg-card object-cover sm:block"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold leading-snug tracking-tight">
          <Link href={paper.url} className="transition-colors hover:text-primary-ink">
            {paper.title}
          </Link>
        </h3>

        <AuthorList authors={paper.authors} highlight={highlight} className="mt-2" />

        <p className="mt-1.5 text-sm text-muted-foreground">
          <span className="font-serif italic text-foreground/80">
            {paper.venue.name}
          </span>
          <span className="mx-1.5 text-muted-foreground/50">|</span>
          <span className="font-mono text-xs">{paper.year}</span>
          {status ? (
            <>
              <span className="mx-1.5 text-muted-foreground/50">|</span>
              <span className="rounded bg-primary-soft px-1.5 py-0.5 text-xs font-medium text-foreground">
                {status}
              </span>
            </>
          ) : null}
        </p>

        {showLinks ? <LinkButtons links={paper.links} size="sm" className="mt-3" /> : null}
      </div>
    </article>
  );
}
