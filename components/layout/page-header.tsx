import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Consistent top of a listing page: title, lead paragraph, optional aside. */
export function PageHeader({
  title,
  lead,
  children,
  className,
}: {
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b pb-10 pt-14", className)}>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      {lead ? (
        <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground">
          {lead}
        </p>
      ) : null}
      {children}
    </header>
  );
}
