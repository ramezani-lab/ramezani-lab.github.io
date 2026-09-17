import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { getAllTags } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Topics",
  description: "Every topic used across DAISY Lab publications and news.",
  path: "/tags",
});

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHeader
        title="Topics"
        lead="Keywords attached to publications and news, ordered by how often they appear."
      />
      <ul className="flex flex-wrap gap-2 py-12">
        {tags.map((tag) => (
          <li key={tag.slug}>
            <Link
              href={tag.url}
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:border-primary hover:bg-primary-soft"
            >
              {tag.name}
              <span className="font-mono text-xs text-muted-foreground">{tag.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
