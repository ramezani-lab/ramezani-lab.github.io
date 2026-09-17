import Link from "next/link";

import { SharifLogo } from "@/components/brand/sharif-logo";
import { Button } from "@/components/ui/button";
import type { ResearchArea } from "@/lib/content";
import { SITE } from "@/lib/site";

import { ResearchMap } from "./research-map";

export function Hero({ areas }: { areas: ResearchArea[] }) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-8 lg:pb-24 lg:pt-20">
      <div className="max-w-xl">
        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
          Data-centric AI systems, built to survive real data.
        </h1>
        <p className="mt-6 font-serif text-lg leading-relaxed text-muted-foreground">
          {SITE.mission}
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button
            size="lg"
            render={<Link href="/papers">Read our publications</Link>}
          />
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/join">Work with us</Link>}
          />
        </div>

        <div className="mt-12 flex items-center gap-4 border-t pt-6">
          <SharifLogo className="size-11 text-muted-foreground" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {SITE.department.name}
            <br />
            {SITE.university.name}, Tehran
          </p>
        </div>
      </div>

      <div>
        <div className="hidden lg:block">
          <ResearchMap areas={areas} />
        </div>

        {/* The map is a drawing; small screens get the same links as a list. */}
        <ul className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:hidden">
          {areas.map((area) => (
            <li key={area.slug}>
              <Link
                href={area.url}
                className="flex h-full flex-col bg-card p-4 transition-colors hover:bg-primary-soft"
              >
                <span className="font-medium leading-snug">{area.title}</span>
                <span className="mt-1 text-sm text-muted-foreground">
                  {area.papers.length > 0
                    ? `${area.papers.length} publication${area.papers.length === 1 ? "" : "s"}`
                    : "New direction"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
