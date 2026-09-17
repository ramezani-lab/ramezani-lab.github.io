import type { Metadata } from "next";

import { PaperBrowser } from "@/components/papers/paper-browser";
import { PageHeader } from "@/components/layout/page-header";
import {
  getAllAreas,
  getAllPapers,
  getAllTags,
  getCurrentMembers,
} from "@/lib/content";
import { toPaperSummary } from "@/lib/content/summaries";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Publications",
  description:
    "Papers from DAISY Lab on data-centric AI systems, network inference, Text-to-SQL, trustworthy machine learning and more.",
  path: "/papers",
});

export default function PapersPage() {
  const papers = getAllPapers();
  const members = getCurrentMembers()
    .filter((person) => person.papers.length > 0)
    .map((person) => ({ value: person.id, label: person.name }));
  const tags = getAllTags()
    .filter((tag) => tag.papers.length > 0)
    .map((tag) => ({
      value: tag.name,
      label: `${tag.name} (${tag.papers.length})`,
    }));
  const areas = getAllAreas()
    .filter((area) => area.papers.length > 0)
    .map((area) => ({ value: area.slug, label: area.title }));

  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHeader
        title="Publications"
        lead="Work from the lab and its collaborators. Every entry links to the paper, and to code or data where they exist."
      />
      <PaperBrowser
        papers={papers.map(toPaperSummary)}
        members={members}
        tags={tags}
        areas={areas}
      />
    </div>
  );
}
