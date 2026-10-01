import type { Metadata } from "next";

import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { PageHeader } from "@/components/layout/page-header";
import { getAllPhotos } from "@/lib/content";
import { toPhotoSummary } from "@/lib/content/summaries";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Gallery",
  description:
    "Photographs from DAISY Lab: talks, defences, workshops and everyday work in the lab.",
  path: "/gallery",
});

export default function GalleryPage() {
  const photos = getAllPhotos();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHeader
        title="Gallery"
        lead="Photographs from the lab — talks, defences, workshops and the days in between."
      />
      {photos.length === 0 ? (
        <p className="py-16 text-sm text-muted-foreground">
          Photographs will appear here.
        </p>
      ) : (
        <GalleryGrid photos={photos.map(toPhotoSummary)} />
      )}
    </div>
  );
}
