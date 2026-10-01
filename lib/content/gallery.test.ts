import { describe, expect, it } from "vitest";

import { photoId, resolvePhotos } from "./gallery";
import { galleryPhotoSchema, type PhotoManifest } from "./schema";

const entry = (image: string, over: Record<string, unknown> = {}) =>
  galleryPhotoSchema.parse({
    image,
    caption: `Caption for ${image}`,
    date: "2026-05-12",
    ...over,
  });

const sized = (id: string): PhotoManifest[string] => ({
  width: 4032,
  height: 3024,
  full: `/photos/${id}.webp`,
  renditions: [{ width: 800, url: `/photos/${id}-800.webp` }],
});

describe("photoId", () => {
  it("is the file name without its extension, slugified", () => {
    expect(photoId("2026-05-12-thesis-defense.JPG")).toBe(
      "2026-05-12-thesis-defense",
    );
    expect(photoId("Lab retreat (2).jpeg")).toBe("lab-retreat-2");
  });
});

describe("galleryPhotoSchema", () => {
  it("requires an image, a caption and an ISO date", () => {
    expect(() =>
      galleryPhotoSchema.parse({ image: "a.jpg", caption: "C" }),
    ).toThrow();
    expect(() =>
      galleryPhotoSchema.parse({
        image: "a.jpg",
        caption: "C",
        date: "12/05/2026",
      }),
    ).toThrow();
    expect(() =>
      galleryPhotoSchema.parse({ image: "a.jpg", date: "2026-05-12" }),
    ).toThrow();
  });

  it("defaults tags to an empty array and leaves the rest undefined", () => {
    const photo = entry("a.jpg");
    expect(photo.tags).toEqual([]);
    expect(photo.description).toBeUndefined();
    expect(photo.location).toBeUndefined();
    expect(photo.news).toBeUndefined();
  });
});

describe("resolvePhotos", () => {
  it("merges the manifest in and sorts newest first", () => {
    const photos = resolvePhotos(
      [
        entry("a.jpg", { date: "2024-01-01" }),
        entry("b.jpg", { date: "2026-05-12" }),
      ],
      { a: sized("a"), b: sized("b") },
    );
    expect(photos.map((photo) => photo.id)).toEqual(["b", "a"]);
    expect(photos[0].width).toBe(4032);
    expect(photos[0].full).toBe("/photos/b.webp");
  });

  it("names both files when two of them resolve to one id", () => {
    expect(() =>
      resolvePhotos([entry("lab-day.jpg"), entry("lab_day.jpg")], {
        "lab-day": sized("lab-day"),
      }),
    ).toThrow(/lab_day\.jpg.*lab-day\.jpg.*"lab-day"/s);
  });

  it("tells the author to run the pipeline when an image has no renditions", () => {
    expect(() => resolvePhotos([entry("missing.jpg")], {})).toThrow(
      /missing\.jpg.*pnpm build:gallery/s,
    );
  });
});
