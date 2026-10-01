import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NewsCard } from "@/components/cards/news-card";
import { PaperCard } from "@/components/cards/paper-card";
import { PageHeader } from "@/components/layout/page-header";
import { getAllTags, getTag } from "@/lib/content";
import { assetPath } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag: slug } = await params;
  const tag = getTag(slug);
  if (!tag) return {};
  return buildMetadata({
    title: tag.name,
    description: `Publications and news from DAISY Lab tagged ${tag.name}.`,
    path: tag.url,
  });
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: slug } = await params;
  const tag = getTag(slug);
  if (!tag) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHeader
        title={tag.name}
        lead={`${tag.count} ${tag.count === 1 ? "item" : "items"} tagged with this topic.`}
      >
        <Link href="/tags" className="link-underline mt-6 inline-block text-sm">
          All topics
        </Link>
      </PageHeader>

      {tag.papers.length > 0 ? (
        <section className="py-10">
          <h2 className="text-xl font-semibold tracking-tight">Publications</h2>
          <ul className="mt-2 divide-y">
            {tag.papers.map((paper) => (
              <li key={paper.slug}>
                <PaperCard paper={paper} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tag.news.length > 0 ? (
        <section className="border-t py-10">
          <h2 className="text-xl font-semibold tracking-tight">News</h2>
          <ul className="mt-2 divide-y">
            {tag.news.map((item) => (
              <li key={item.slug}>
                <NewsCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tag.photos.length > 0 ? (
        <section className="border-t py-10">
          <h2 className="text-xl font-semibold tracking-tight">Gallery</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {tag.photos.map((photo) => (
              <li key={photo.id}>
                <Link href={photo.url} className="group block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static export: no optimizer */}
                  <img
                    src={assetPath(photo.renditions[0].url)}
                    alt={photo.caption}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    className="w-full rounded-md border bg-card transition-opacity group-hover:opacity-90"
                  />
                  <p className="mt-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    {photo.caption}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
