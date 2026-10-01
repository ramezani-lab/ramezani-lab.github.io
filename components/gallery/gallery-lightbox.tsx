"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { assetPath } from "@/lib/site";

import type { PhotoSummary } from "./gallery-grid";

/**
 * The detail view for one photograph.
 *
 * Base UI's dialog supplies the focus trap, the `Esc` handler and the scroll
 * lock; the arrow keys are wired here, over the same filtered list the grid
 * shows, so paging never jumps to a hidden photo.
 */
export function GalleryLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: PhotoSummary[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];

  useEffect(() => {
    if (!photo) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        onIndexChange((index + 1) % photos.length);
      } else if (event.key === "ArrowLeft") {
        onIndexChange((index - 1 + photos.length) % photos.length);
      }
    };
    // Capture phase: the dialog's own focus management stops arrow keys from
    // bubbling back up to `window`, so a listener on the bubble phase never
    // runs while the popup holds focus.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [photo, index, photos.length, onIndexChange]);

  if (!photo) return null;

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      {/* `DialogContent` caps itself at `sm:max-w-sm`; widen it from `sm` up. */}
      <DialogContent className="sm:max-w-5xl">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export: no optimizer */}
          <img
            src={assetPath(photo.full)}
            alt={photo.caption}
            width={photo.width}
            height={photo.height}
            className="max-h-[70dvh] w-full rounded-md object-contain"
          />
          <figcaption className="mt-5">
            <DialogTitle className="text-lg font-semibold leading-snug tracking-tight">
              {photo.caption}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
              {[formatDate(photo.date), photo.location]
                .filter(Boolean)
                .join(" · ")}
            </DialogDescription>
            {photo.description ? (
              <p className="mt-3 font-serif leading-relaxed text-foreground/90">
                {photo.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {photo.news ? (
                <Link href={photo.news.url} className="link-underline">
                  {photo.news.title}
                </Link>
              ) : null}
              {photo.tags.map((tag) => (
                <Link
                  key={tag.url}
                  href={tag.url}
                  className="text-muted-foreground transition-colors hover:text-primary-ink"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </figcaption>
        </figure>

        {photos.length > 1 ? (
          <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() =>
                onIndexChange((index - 1 + photos.length) % photos.length)
              }
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>
            <span className="font-mono text-xs">
              {index + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={() => onIndexChange((index + 1) % photos.length)}
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
