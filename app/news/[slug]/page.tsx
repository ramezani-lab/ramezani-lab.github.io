import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PaperCard } from "@/components/cards/paper-card";
import { TagList } from "@/components/content/tag-list";
import { MdxContent } from "@/components/mdx-content";
import { getAllNews, getNewsItem } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, buildMetadata, JsonLd, ogImage } from "@/lib/seo";
import { assetPath } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllNews().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getNewsItem(slug);
  if (!item) return {};
  return buildMetadata({
    title: item.title,
    description: item.summary,
    path: item.url,
    image: ogImage.news(item.slug),
    type: "article",
    publishedTime: item.date,
    tags: item.tags,
  });
}

export default async function NewsItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getNewsItem(slug);
  if (!item) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 pt-14">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "News", url: "/news" },
          { name: item.title, url: item.url },
        ])}
      />

      <Link href="/news" className="link-underline text-sm text-muted-foreground">
        News
      </Link>

      <header className="mt-6">
        <time dateTime={item.date} className="font-mono text-xs text-muted-foreground">
          {formatDate(item.date)}
        </time>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {item.title}
        </h1>
        {item.summary ? (
          <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
            {item.summary}
          </p>
        ) : null}
      </header>

      {item.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetPath(item.cover)}
          alt=""
          className="mt-10 w-full rounded-lg border bg-card"
        />
      ) : null}

      <MdxContent
        source={item.body}
        baseUrl={`/content/news/${item.slug}`}
        className="mt-10"
      />

      {item.people.length > 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          People:{" "}
          {item.people.map((person, index) => (
            <span key={person.id}>
              {index > 0 ? ", " : ""}
              <Link href={person.url} className="link-underline text-foreground">
                {person.name}
              </Link>
            </span>
          ))}
        </p>
      ) : null}

      {item.papers.length > 0 ? (
        <section className="mt-12 border-t pt-4">
          <h2 className="pt-6 text-lg font-semibold tracking-tight">Related publication</h2>
          <ul className="divide-y">
            {item.papers.map((paper) => (
              <li key={paper.slug}>
                <PaperCard paper={paper} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <TagList tags={item.tags} className="mt-12" />
    </article>
  );
}
