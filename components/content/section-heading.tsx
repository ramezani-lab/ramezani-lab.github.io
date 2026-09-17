import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: ReactNode;
  /** Optional link to the full listing this section previews. */
  action?: { href: string; label: string };
  className?: string;
  as?: "h2" | "h3";
}

/** Section title with an optional description and a link to the full listing. */
export function SectionHeading({
  title,
  description,
  action,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b pb-4",
        className,
      )}
    >
      <div className="max-w-2xl">
        <Tag className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          {title}
        </Tag>
        {description ? (
          <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link href={action.href} className="link-underline shrink-0 text-sm font-medium">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
