import { describe, expect, it } from "vitest";

import { GRID_WIDTHS, orientedSize, srcSet, thumbnailPlan } from "./images";

describe("thumbnailPlan", () => {
  it("emits every grid width a large source can fill", () => {
    expect(thumbnailPlan(4032)).toEqual([...GRID_WIDTHS]);
  });

  it("never upscales", () => {
    expect(thumbnailPlan(1200)).toEqual([800]);
    expect(thumbnailPlan(800)).toEqual([800]);
  });

  it("falls back to the source width for an image smaller than the smallest grid width", () => {
    expect(thumbnailPlan(640)).toEqual([640]);
  });
});

describe("orientedSize", () => {
  it("leaves an unrotated image alone", () => {
    expect(orientedSize({ width: 4032, height: 3024, orientation: 1 })).toEqual(
      {
        width: 4032,
        height: 3024,
      },
    );
  });

  it("assumes no rotation when the file carries no orientation tag", () => {
    expect(orientedSize({ width: 4032, height: 3024 })).toEqual({
      width: 4032,
      height: 3024,
    });
  });

  it("swaps the axes for the four orientations that rotate by a quarter turn", () => {
    for (const orientation of [5, 6, 7, 8]) {
      expect(orientedSize({ width: 4032, height: 3024, orientation })).toEqual({
        width: 3024,
        height: 4032,
      });
    }
  });

  it("does not swap for the mirrored orientations below 5", () => {
    expect(orientedSize({ width: 4032, height: 3024, orientation: 2 })).toEqual(
      {
        width: 4032,
        height: 3024,
      },
    );
  });
});

describe("srcSet", () => {
  it("formats a descriptor per rendition", () => {
    expect(
      srcSet([
        { width: 800, url: "/photos/a-800.webp" },
        { width: 1600, url: "/photos/a-1600.webp" },
      ]),
    ).toBe("/photos/a-800.webp 800w, /photos/a-1600.webp 1600w");
  });
});
