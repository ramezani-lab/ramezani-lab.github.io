import Link from "next/link";

import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

/** Tags as links to their listing page. */
export function TagList({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={`/tags/${slugify(tag)}`}
            className="inline-block rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft hover:text-foreground"
          >
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
