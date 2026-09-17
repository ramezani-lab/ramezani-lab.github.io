import Link from "next/link";

import type { PaperAuthor } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Paper authors in order. Lab members link to their profile; external
 * co-authors are plain text, which is also how a reader tells them apart.
 */
export function AuthorList({
  authors,
  className,
  highlight,
}: {
  authors: PaperAuthor[];
  className?: string;
  /** Person id to mark as the current page's subject. */
  highlight?: string;
}) {
  return (
    <p
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    >
      {authors.map((author, index) => (
        <span key={index}>
          {index > 0 ? ", " : ""}
          {author.kind === "member" ? (
            <Link
              href={author.person.url}
              className={cn(
                "text-foreground transition-colors hover:text-primary-ink",
                author.person.id === highlight
                  ? "font-semibold"
                  : "font-medium",
              )}
            >
              {author.person.name}
            </Link>
          ) : (
            author.name
          )}
        </span>
      ))}
    </p>
  );
}
