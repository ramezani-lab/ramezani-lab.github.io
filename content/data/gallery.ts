import type { GalleryPhotoInput } from "@/lib/content/schema";

/**
 * Photographs shown at /gallery, newest first in the rendered page regardless
 * of the order here.
 *
 * Put the image file in `content/gallery/images/`, then add an entry whose
 * `image` is that file name. `caption` and `date` are required; `description`,
 * `location`, `tags` and `news` are optional. Run `pnpm build:gallery` after
 * adding files.
 *
 *   {
 *     image: "2026-05-12-thesis-defense.jpg",
 *     caption: "A one-line caption, shown under the photo",
 *     date: "2026-05-12",
 *     description: "An optional paragraph, shown in the lightbox.",
 *     location: "Department of Computer Engineering, Sharif University",
 *     tags: ["Graph Mining"],
 *     news: "a-news-slug",
 *   }
 */
export const GALLERY: GalleryPhotoInput[] = [];
