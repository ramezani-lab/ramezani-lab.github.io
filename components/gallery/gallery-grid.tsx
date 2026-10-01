"use client";

import { useMemo, useState } from "react";

import { formatDate } from "@/lib/format";
import { srcSet } from "@/lib/images";
import { assetPath } from "@/lib/site";
import { cn } from "@/lib/utils";

import { GalleryLightbox } from "./gallery-lightbox";
import { setPhotoHash, usePhotoHash } from "./use-photo-hash";

/** Serializable shape of a photo for the client grid. */
export interface PhotoSummary {
  id: string;
  caption: string;
  date: string;
  description?: string;
  location?: string;
  width: number;
  height: number;
  full: string;
  renditions: Array<{ width: number; url: string }>;
  tags: Array<{ name: string; url: string }>;
  news?: { title: string; url: string };
}

const SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="me-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {["all", ...options].map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors",
            value === option
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-input text-muted-foreground hover:border-ring hover:text-foreground",
          )}
        >
          {option === "all" ? "All" : option}
        </button>
      ))}
    </div>
  );
}

/**
 * The gallery: a masonry grid of photographs with a lightbox.
 *
 * Every tile carries the intrinsic size the build recorded, so the column
 * reserves the right height before the file arrives and nothing below it moves.
 */
export function GalleryGrid({ photos }: { photos: PhotoSummary[] }) {
  const [year, setYear] = useState("all");
  const [tag, setTag] = useState("all");
  // The open photo lives in the URL fragment, so a pasted or searched `#id`
  // opens it. An id that matches nothing — or one the filters hide — leaves
  // the page closed, because it simply finds no index below.
  const openId = usePhotoHash();

  const years = useMemo(
    () =>
      [...new Set(photos.map((photo) => photo.date.slice(0, 4)))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [photos],
  );
  const tags = useMemo(
    () =>
      [
        ...new Set(photos.flatMap((photo) => photo.tags.map((it) => it.name))),
      ].sort((a, b) => a.localeCompare(b)),
    [photos],
  );

  const filtered = useMemo(
    () =>
      photos.filter(
        (photo) =>
          (year === "all" || photo.date.startsWith(year)) &&
          (tag === "all" || photo.tags.some((it) => it.name === tag)),
      ),
    [photos, year, tag],
  );

  const index = filtered.findIndex((photo) => photo.id === openId);

  return (
    <div>
      {years.length > 1 || tags.length > 0 ? (
        <div className="flex flex-col gap-3 border-b py-5 sm:flex-row sm:items-center sm:gap-6">
          <Chips label="Year" options={years} value={year} onChange={setYear} />
          <Chips label="Topic" options={tags} value={tag} onChange={setTag} />
        </div>
      ) : null}

      <p className="py-4 text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} of {photos.length} photographs
      </p>

      {filtered.length === 0 ? (
        <p className="border-t py-16 text-center text-sm text-muted-foreground">
          No photographs match these filters.
        </p>
      ) : (
        <ul className="gap-5 pb-16 sm:columns-2 lg:columns-3">
          {filtered.map((photo) => (
            <li key={photo.id} className="mb-5 break-inside-avoid">
              <button
                type="button"
                onClick={() => setPhotoHash(photo.id)}
                className="group w-full text-start"
                aria-label={`Open: ${photo.caption}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static export: no optimizer */}
                <img
                  src={assetPath(photo.renditions[0].url)}
                  srcSet={srcSet(
                    photo.renditions.map((rendition) => ({
                      width: rendition.width,
                      url: assetPath(rendition.url),
                    })),
                  )}
                  sizes={SIZES}
                  alt={photo.caption}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-md border bg-card transition-opacity group-hover:opacity-90"
                />
                <p className="mt-2.5 text-sm font-medium leading-snug tracking-tight transition-colors group-hover:text-primary-ink">
                  {photo.caption}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[formatDate(photo.date), photo.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {index >= 0 ? (
        <GalleryLightbox
          photos={filtered}
          index={index}
          onIndexChange={(next) => setPhotoHash(filtered[next].id)}
          onClose={() => setPhotoHash(null)}
        />
      ) : null}
    </div>
  );
}
