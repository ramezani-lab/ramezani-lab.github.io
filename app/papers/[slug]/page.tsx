import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PaperCard } from "@/components/cards/paper-card";
import { AuthorList } from "@/components/content/author-list";
import { BibtexBlock } from "@/components/content/bibtex-copy";
import { LinkButtons } from "@/components/content/link-buttons";
import { TagList } from "@/components/content/tag-list";
import { MdxContent } from "@/components/mdx-content";
import { getAllPapers, getPaper, getRelatedPapers } from "@/lib/content";
import { formatDate } from "@/lib/format";
import {
  breadcrumbJsonLd,
  buildMetadata,
  JsonLd,
  ogImage,
  scholarlyArticleJsonLd,
} from "@/lib/seo";
import { assetPath } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPapers().map((paper) => ({ slug: paper.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) return {};

  return buildMetadata({
    title: paper.title,
    description: paper.abstract.slice(0, 200),
    path: paper.url,
    image: ogImage.paper(paper.slug),
    type: "article",
    publishedTime: paper.date,
    authors: paper.authors.map((author) =>
      author.kind === "member" ? author.person.name : author.name,
    ),
    tags: paper.tags,
  });
}

const STATUS_LABELS = {
  published: null,
  accepted: "To appear",
  "under-review": "Under review",
  preprint: "Preprint",
} as const;

export default async function PaperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  const related = getRelatedPapers(paper);
  const status = STATUS_LABELS[paper.status];

  return (
    <article className="mx-auto max-w-6xl px-4 pt-14">
      <JsonLd
        data={scholarlyArticleJsonLd({
          title: paper.title,
          abstract: paper.abstract,
          url: paper.url,
          year: paper.year,
          date: paper.date,
          authors: paper.authors.map((author) =>
            author.kind === "member"
              ? { name: author.person.name, url: author.person.url }
              : { name: author.name },
          ),
          venue: paper.venue.name,
          tags: paper.tags,
          image: paper.cover,
          sameAs: paper.links.map((link) => link.url),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Publications", url: "/papers" },
          { name: paper.title, url: paper.url },
        ])}
      />

      <Link
        href="/papers"
        className="link-underline text-sm text-muted-foreground"
      >
        Publications
      </Link>

      <header className="mt-6 max-w-4xl">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {paper.title}
        </h1>
        <AuthorList authors={paper.authors} className="mt-5 text-base" />
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <span className="font-serif text-base italic text-foreground/85">
            {paper.venue.name}
          </span>
          <span className="font-mono text-xs">
            {paper.date ? formatDate(paper.date) : paper.year}
          </span>
          {status ? (
            <span className="rounded bg-primary-soft px-2 py-0.5 text-xs font-medium text-foreground">
              {status}
            </span>
          ) : null}
        </p>
        <LinkButtons links={paper.links} className="mt-6" />
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
        <div className="min-w-0">
          {paper.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assetPath(paper.cover)}
              alt=""
              className="mb-10 w-full rounded-lg border bg-card"
            />
          ) : null}

          <section>
            <h2 className="text-lg font-semibold tracking-tight">Abstract</h2>
            <p className="mt-3 max-w-[70ch] font-serif text-lg leading-relaxed">
              {paper.abstract}
            </p>
          </section>

          <MdxContent
            source={paper.body}
            baseUrl={`/content/papers/${paper.slug}`}
            className="mt-10"
          />

          <section className="mt-14">
            <h2 className="text-xl font-semibold tracking-tight">
              Cite this paper
            </h2>
            <div className="mt-4">
              <BibtexBlock bibtex={paper.bibtex} />
            </div>
          </section>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {paper.areas.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold">Research areas</h2>
              <ul className="mt-3 space-y-2">
                {paper.areas.map((area) => (
                  <li key={area.slug}>
                    <Link href={area.url} className="link-underline text-sm">
                      {area.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {paper.tags.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold">Topics</h2>
              <TagList tags={paper.tags} className="mt-3" />
            </div>
          ) : null}

          {paper.members.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold">Lab authors</h2>
              <ul className="mt-3 space-y-2">
                {paper.members.map((member) => (
                  <li key={member.id}>
                    <Link href={member.url} className="link-underline text-sm">
                      {member.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t pt-4">
          <h2 className="pt-8 text-xl font-semibold tracking-tight">
            Related work
          </h2>
          <ul className="mt-2 divide-y">
            {related.map((item) => (
              <li key={item.slug}>
                <PaperCard paper={item} showLinks={false} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
