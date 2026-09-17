import Link from "next/link";

import { DaisyMark } from "@/components/brand/daisy-mark";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Lab identity: the mark, the wordmark, and what the letters stand for.
 * `compact` drops the expansion for tight bars.
 */
export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label={`${SITE.fullName} — home`}
    >
      <DaisyMark className="size-9 text-foreground" />
      <span className="flex flex-col leading-none">
        <span className="text-[1.35rem] font-bold tracking-tight">
          {SITE.shortName}
        </span>
        {compact ? null : (
          <span className="mt-1 hidden text-[0.7rem] leading-none text-muted-foreground sm:block">
            {SITE.tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
