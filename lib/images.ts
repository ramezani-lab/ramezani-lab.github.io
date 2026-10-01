/**
 * Sizes for the build-time image pipeline.
 *
 * A static export cannot optimize images on request, so
 * `scripts/build-gallery-images.ts` writes these renditions once and the markup
 * picks one with `srcset`.
 */

/** Widths offered to the gallery grid: one for most screens, one for retina. */
export const GRID_WIDTHS = [800, 1600] as const;

/** The lightbox image is capped on its longest edge, not its width. */
export const FULL_MAX_EDGE = 2400;

/**
 * Which widths to generate for a source this wide. Never upscales, and always
 * returns at least one width so no `srcset` is ever empty.
 */
export function thumbnailPlan(sourceWidth: number): number[] {
  const widths = GRID_WIDTHS.filter((width) => width <= sourceWidth);
  return widths.length > 0 ? [...widths] : [sourceWidth];
}

/**
 * The size a photo has once EXIF rotation is applied.
 *
 * sharp's `.rotate()` applies the orientation when encoding, but `metadata()`
 * reports the stored, unrotated size. Orientations 5-8 turn the image by a
 * quarter, so the axes have to be swapped — otherwise every portrait photo
 * taken on a phone reserves a landscape box in the grid and the column jumps
 * when the file arrives.
 */
export function orientedSize(metadata: {
  width: number;
  height: number;
  orientation?: number;
}): { width: number; height: number } {
  const quarterTurn = (metadata.orientation ?? 1) >= 5;
  return quarterTurn
    ? { width: metadata.height, height: metadata.width }
    : { width: metadata.width, height: metadata.height };
}

/** A `srcset` value: `url width, url width`. */
export function srcSet(
  renditions: ReadonlyArray<{ width: number; url: string }>,
): string {
  return renditions
    .map((rendition) => `${rendition.url} ${rendition.width}w`)
    .join(", ");
}
