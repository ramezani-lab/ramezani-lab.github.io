import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";

import { MdxContent } from "@/components/mdx-content";
import { PageHeader } from "@/components/layout/page-header";
import { SharifLogo } from "@/components/brand/sharif-logo";
import { getAllPositions, getDirector } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Join Us",
  description:
    "Open positions for PhD, MSc and undergraduate researchers at DAISY Lab, Sharif University of Technology.",
  path: "/join",
});

const LEVEL_LABELS = {
  phd: "PhD",
  msc: "MSc",
  bsc: "Undergraduate",
  intern: "Internship",
  postdoc: "Postdoc",
} as const;

export default function JoinPage() {
  const positions = getAllPositions();
  const director = getDirector();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHeader
        title="Join us"
        lead="We work on problems where data, not model size, is the bottleneck. If that is the kind of work you want to do, here is how to reach us."
      />

      <div className="grid gap-16 py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
        <div className="min-w-0 divide-y">
          {positions.map((position) => (
            <section
              key={position.slug}
              id={position.slug}
              className="scroll-mt-24 py-8"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold tracking-tight">
                  {position.title}
                </h2>
                <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {LEVEL_LABELS[position.level]}
                </span>
                <span
                  className={
                    position.status === "open"
                      ? "rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium"
                      : "rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  }
                >
                  {position.status === "open" ? "Open" : "Closed"}
                </span>
              </div>

              {position.summary ? (
                <p className="mt-3 max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground">
                  {position.summary}
                </p>
              ) : null}

              {position.deadline ? (
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  Apply by {formatDate(position.deadline)}
                </p>
              ) : null}

              <MdxContent
                source={position.body}
                baseUrl={`/content/positions/${position.slug}`}
                className="mt-4"
              />
            </section>
          ))}
        </div>

        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold">How to apply</h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1.</span> Read a
                couple of the lab&apos;s recent papers and decide which
                direction interests you.
              </li>
              <li>
                <span className="font-medium text-foreground">2.</span> Email{" "}
                {director.name} with your CV, transcript, and a short paragraph
                on what you want to work on and why.
              </li>
              <li>
                <span className="font-medium text-foreground">3.</span> Include
                links to code you have written, if you have any.
              </li>
            </ol>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_10%)]"
            >
              <Mail className="size-4" />
              {SITE.email}
            </a>
          </section>

          <section>
            <h2 className="font-semibold">Where we are</h2>
            <p className="mt-3 flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>
                {SITE.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </p>
            <SharifLogo className="mt-6 size-12 text-muted-foreground/70" />
          </section>
        </aside>
      </div>
    </div>
  );
}
