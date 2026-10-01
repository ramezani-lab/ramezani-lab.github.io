import { slugify } from "../slug";
import type { GalleryPhotoData, PhotoManifest, RawPhoto } from "./schema";

/**
 * Stable id for a photo: its file name, slugified.
 *
 * The file system already guarantees one entry per name, and an id taken from
 * the file survives a reworded caption — which matters, because the id is the
 * photo's deep link.
 */
export function photoId(image: string): string {
  return slugify(image.replace(/\.[^./]+$/, ""));
}

/**
 * Merges the authored metadata with the generated sizes, newest first.
 *
 * Pure, so the whole contract — ids, collisions, missing renditions, order —
 * is unit-tested without touching the file system.
 */
export function resolvePhotos(
  entries: GalleryPhotoData[],
  manifest: PhotoManifest,
): RawPhoto[] {
  const seen = new Map<string, string>();

  const photos = entries.map((entry) => {
    const id = photoId(entry.image);

    const previous = seen.get(id);
    if (previous) {
      throw new Error(
        `duplicate photo in content/data/gallery.ts: "${entry.image}" and "${previous}" both resolve to the id "${id}" — rename one of the files`,
      );
    }
    seen.set(id, entry.image);

    const sizes = manifest[id];
    if (!sizes) {
      throw new Error(
        `no generated image for "${entry.image}" in content/data/gallery.ts — put the file in content/gallery/images/ and run \`pnpm build:gallery\``,
      );
    }

    return { ...entry, ...sizes, id };
  });

  return photos.sort(
    (a, b) =>
      b.date.localeCompare(a.date) || a.caption.localeCompare(b.caption),
  );
}
