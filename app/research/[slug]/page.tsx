import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PaperCard } from "@/components/cards/paper-card";
import { PersonCard } from "@/components/cards/person-card";
import { AreaIcon } from "@/components/content/area-icon";
import { MdxContent } from "@/components/mdx-content";
import { getAllAreas, getArea } from "@/lib/content";
import { breadcrumbJsonLd, buildMetadata, JsonLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllAreas().map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) return {};
  return buildMetadata({
    title: area.title,
    description: area.summary,
    path: area.url,
  });
}

export default async function ResearchAreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-14">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Research", url: "/research" },
          { name: area.title, url: area.url },
        ])}
      />

      <Link href="/research" className="link-underline text-sm text-muted-foreground">
        Research
      </Link>

      <header className="mt-6 max-w-3xl">
        <AreaIcon name={area.icon} className="size-8 text-primary-ink" />
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">{area.title}</h1>
        <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
          {area.summary}
        </p>
      </header>

      <MdxContent
        source={area.body}
        baseUrl={`/content/research/${area.slug}`}
        className="mt-10"
      />

      {area.papers.length > 0 ? (
        <section className="mt-16 border-t pt-4">
          <h2 className="pt-8 text-xl font-semibold tracking-tight">
            Publications in this area
          </h2>
          <ul className="mt-2 divide-y">
            {area.papers.map((paper) => (
              <li key={paper.slug}>
                <PaperCard paper={paper} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {area.people.length > 0 ? (
        <section className="mt-16 border-t pt-4">
          <h2 className="pt-8 text-xl font-semibold tracking-tight">Who works on this</h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {area.people.map((person) => (
              <li key={person.id}>
                <PersonCard person={person} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
