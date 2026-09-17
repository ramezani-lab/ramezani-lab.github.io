import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/**
 * Shared MDX plugin chain, used by every content route so biographies, papers,
 * news and research pages render identically. Math via KaTeX, code via Shiki.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mdxOptions: any = {
  remarkPlugins: [remarkGfm, remarkMath],
  rehypePlugins: [
    rehypeSlug,
    [
      rehypeAutolinkHeadings,
      { behavior: "wrap", properties: { className: "heading-anchor" } },
    ],
    [
      rehypePrettyCode,
      {
        theme: { light: "github-light", dark: "github-dark-dimmed" },
        keepBackground: false,
        defaultLang: "plaintext",
      },
    ],
    rehypeKatex,
  ],
};
