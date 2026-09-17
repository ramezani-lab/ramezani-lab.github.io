import { describe, expect, it } from "vitest";

import { absoluteUrl, JsonLd } from "./seo";
import { SITE } from "./site";

describe("absoluteUrl", () => {
  it("adds a trailing slash to page paths", () => {
    expect(absoluteUrl("/papers/dani")).toBe(`${SITE.url}/papers/dani/`);
    expect(absoluteUrl("/")).toBe(`${SITE.url}/`);
  });

  it("leaves files and fragments intact", () => {
    expect(absoluteUrl("/og/default.png")).toBe(`${SITE.url}/og/default.png`);
    expect(absoluteUrl("/join#phd")).toBe(`${SITE.url}/join/#phd`);
  });
});

describe("JsonLd", () => {
  it("escapes angle brackets so content cannot close the script", () => {
    const element = JsonLd({ data: { name: "</script><b>" } });
    const html = (element.props as { dangerouslySetInnerHTML: { __html: string } })
      .dangerouslySetInnerHTML.__html;
    expect(html).not.toContain("</script>");
  });
});
