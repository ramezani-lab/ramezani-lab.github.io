import type { Metadata } from "next";

import { NewsCard } from "@/components/cards/news-card";
import { PageHeader } from "@/components/layout/page-header";
import { getAllNews } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "News",
  description: "Papers, talks, awards and announcements from DAISY Lab.",
  path: "/news",
});

export default function NewsPage() {
  const news = getAllNews();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHeader title="News" lead="Papers, talks, theses and announcements from the lab." />
      {news.length === 0 ? (
        <p className="py-16 text-sm text-muted-foreground">Nothing published yet.</p>
      ) : (
        <ul className="divide-y">
          {news.map((item) => (
            <li key={item.slug}>
              <NewsCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
