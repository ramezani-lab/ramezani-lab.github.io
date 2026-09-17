import { describe, expect, it } from "vitest";

import { assetPath, normalizeBasePath } from "./site";

describe("normalizeBasePath", () => {
  it("treats empty and root as no base path", () => {
    expect(normalizeBasePath(undefined)).toBe("");
    expect(normalizeBasePath("")).toBe("");
    expect(normalizeBasePath("/")).toBe("");
  });

  it("adds a leading slash and strips a trailing one", () => {
    expect(normalizeBasePath("daisy")).toBe("/daisy");
    expect(normalizeBasePath("/daisy/")).toBe("/daisy");
  });
});

describe("assetPath", () => {
  it("prefixes site-relative paths with the base path", () => {
    expect(assetPath("/img/a.png", "/daisy")).toBe("/daisy/img/a.png");
    expect(assetPath("/img/a.png", "")).toBe("/img/a.png");
  });

  it("leaves remote and data URLs untouched", () => {
    expect(assetPath("https://e.com/a.png", "/daisy")).toBe(
      "https://e.com/a.png",
    );
    expect(assetPath("data:image/png;base64,x", "/daisy")).toBe(
      "data:image/png;base64,x",
    );
  });
});
