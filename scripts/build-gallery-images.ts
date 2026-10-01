/**
 * Generates the gallery's WebP renditions and a manifest of intrinsic sizes.
 *
 * A static export has no image optimizer at request time, so the derivatives
 * are produced here, once, and the grid picks one with `srcset`. Output goes to
 * `public/photos/` — not `public/content/`, which `sync-assets` wipes on every
 * run, which would defeat the mtime cache below.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { photoId } from "../lib/content/gallery";
import type { PhotoManifest } from "../lib/content/schema";
import { FULL_MAX_EDGE, orientedSize, thumbnailPlan } from "../lib/images";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SOURCE_DIR = join(ROOT, "content", "gallery", "images");
const OUT_DIR = join(ROOT, "public", "photos");
const PUBLIC_PREFIX = "/photos";
const SUPPORTED = /\.(jpe?g|png|webp|avif|tiff?)$/i;
const QUALITY = 82;

/** True when the generated file is at least as new as its source. */
function fresh(target: string, source: string): boolean {
  return (
    existsSync(target) && statSync(target).mtimeMs >= statSync(source).mtimeMs
  );
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const files = existsSync(SOURCE_DIR)
    ? readdirSync(SOURCE_DIR)
        .filter((name) => !name.startsWith(".") && SUPPORTED.test(name))
        .sort()
    : [];

  const manifest: PhotoManifest = {};
  let encoded = 0;

  for (const file of files) {
    const source = join(SOURCE_DIR, file);
    const id = photoId(file);
    const metadata = await sharp(source).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(
        `cannot read the dimensions of content/gallery/images/${file}`,
      );
    }

    const { width, height } = orientedSize({
      width: metadata.width,
      height: metadata.height,
      orientation: metadata.orientation,
    });

    const renditions = thumbnailPlan(width).map((target) => ({
      width: target,
      url: `${PUBLIC_PREFIX}/${id}-${target}.webp`,
    }));

    manifest[id] = {
      width,
      height,
      full: `${PUBLIC_PREFIX}/${id}.webp`,
      renditions,
    };

    const jobs = [
      { name: `${id}.webp`, width: FULL_MAX_EDGE, longestEdge: true },
      ...renditions.map((rendition) => ({
        name: `${id}-${rendition.width}.webp`,
        width: rendition.width,
        longestEdge: false,
      })),
    ];

    for (const job of jobs) {
      const target = join(OUT_DIR, job.name);
      if (fresh(target, source)) continue;
      await sharp(source)
        .rotate()
        .resize(
          job.longestEdge
            ? {
                width: job.width,
                height: job.width,
                fit: "inside",
                withoutEnlargement: true,
              }
            : { width: job.width, withoutEnlargement: true },
        )
        .webp({ quality: QUALITY })
        .toFile(target);
      encoded++;
    }
  }

  writeFileSync(
    join(OUT_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(
    `Prepared ${files.length} ${files.length === 1 ? "photo" : "photos"} (${encoded} ${encoded === 1 ? "file" : "files"} encoded)`,
  );
}

void main();
