import Link from "next/link";

import type { NewsItem } from "@/lib/content";
import { formatDate } from "@/lib/format";

const CATEGORY_LABELS = {
  paper: "Publication",
  award: "Award",
  event: "Event",
  talk: "Talk",
  defense: "Thesis defense",
  announcement: "Announcement",
} as const;

/** A news item in a list: date on the left, headline and summary on the right. */
export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="grid gap-x-8 gap-y-2 py-6 sm:grid-cols-[9rem_1fr]">
      <div className="text-sm text-muted-foreground">
        <time dateTime={item.date} className="font-mono text-xs">
          {formatDate(item.date)}
        </time>
        <p className="mt-1 text-xs">{CATEGORY_LABELS[item.category]}</p>
      </div>

      <div className="min-w-0">
        <h3 className="text-lg font-semibold leading-snug tracking-tight">
          <Link
            href={item.url}
            className="transition-colors hover:text-primary-ink"
          >
            {item.title}
          </Link>
        </h3>
        {item.summary ? (
          <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
            {item.summary}
          </p>
        ) : null}
      </div>
    </article>
  );
}
