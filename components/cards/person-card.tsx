import Link from "next/link";

import { DaisyMark } from "@/components/brand/daisy-mark";
import { ROLE_LABELS, type Person } from "@/lib/content";
import { formatYearRange } from "@/lib/format";
import { assetPath } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Initials stand in when a member has no photo yet. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PersonPortrait({
  person,
  className,
}: {
  person: Pick<Person, "name" | "image">;
  className?: string;
}) {
  if (person.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={assetPath(person.image)}
        alt={person.name}
        loading="lazy"
        className={cn(
          "aspect-square w-full rounded-lg border object-cover",
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-muted",
        className,
      )}
    >
      <DaisyMark className="absolute inset-0 m-auto size-2/3 text-foreground/[0.06]" />
      <span className="relative text-2xl font-semibold text-muted-foreground">
        {initials(person.name)}
      </span>
    </span>
  );
}

/** A lab member in a grid: portrait, name, role and years. */
export function PersonCard({ person }: { person: Person }) {
  const years = formatYearRange(person.startYear, person.endYear);

  return (
    <Link href={person.url} className="group block">
      <PersonPortrait
        person={person}
        className="transition-colors group-hover:border-primary"
      />
      <p className="mt-3 font-medium leading-snug group-hover:text-primary-ink">
        {person.name}
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {person.title ?? ROLE_LABELS[person.role]}
      </p>
      {years ? (
        <p className="mt-0.5 font-mono text-xs text-muted-foreground/80">
          {years}
        </p>
      ) : null}
    </Link>
  );
}
