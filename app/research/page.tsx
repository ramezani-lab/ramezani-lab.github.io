import type { Metadata } from "next";

import { AreaCard } from "@/components/cards/area-card";
import { PageHeader } from "@/components/layout/page-header";
import { getAllAreas } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Research",
  description: SITE.mission,
  path: "/research",
});

export default function ResearchPage() {
  const areas = getAllAreas();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHeader title="Research" lead={SITE.mission} />
      <ul className="grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <li key={area.slug}>
            <AreaCard area={area} />
          </li>
        ))}
      </ul>
    </div>
  );
}
