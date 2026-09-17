import Link from "next/link";

import { AreaIcon } from "@/components/content/area-icon";
import type { ResearchArea } from "@/lib/content";

/** A research area as a linked block with its paper count. */
export function AreaCard({ area }: { area: ResearchArea }) {
  return (
    <Link
      href={area.url}
      className="group flex flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary"
    >
      <AreaIcon name={area.icon} className="size-6 text-primary-ink" />
      <h3 className="mt-4 font-semibold leading-snug tracking-tight group-hover:text-primary-ink">
        {area.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {area.summary}
      </p>
      {area.papers.length > 0 ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground/80">
          {area.papers.length}{" "}
          {area.papers.length === 1 ? "publication" : "publications"}
        </p>
      ) : null}
    </Link>
  );
}
