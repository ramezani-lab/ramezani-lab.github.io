import { describe, expect, it } from "vitest";

import { resolveAsset } from "./assets";

describe("resolveAsset", () => {
  it("maps a relative path into public/content", () => {
    expect(resolveAsset("papers", "dani", "./cover.png")).toBe(
      "/content/papers/dani/cover.png",
    );
    expect(resolveAsset("papers", "dani", "img/a.png")).toBe(
      "/content/papers/dani/img/a.png",
    );
  });

  it("keeps absolute and remote paths", () => {
    expect(resolveAsset("people", "x", "/img/a.png")).toBe("/img/a.png");
    expect(resolveAsset("people", "x", "https://e.com/a.png")).toBe(
      "https://e.com/a.png",
    );
  });

  it("passes undefined through", () => {
    expect(resolveAsset("people", "x", undefined)).toBeUndefined();
  });
});
