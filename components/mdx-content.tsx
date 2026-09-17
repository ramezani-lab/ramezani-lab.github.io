import { MDXRemote } from "next-mdx-remote-client/rsc";

import { mdxComponents } from "@/lib/mdx/components";
import { mdxOptions } from "@/lib/mdx/options";
import { cn } from "@/lib/utils";

interface MdxContentProps {
  source: string;
  /** Public path for the document's co-located images. */
  baseUrl?: string;
  className?: string;
}

/**
 * Compiles and renders MDX at build time inside a Server Component, so no MDX
 * tooling reaches the browser bundle. Renders nothing for an empty body.
 */
export function MdxContent({ source, baseUrl, className }: MdxContentProps) {
  if (!source.trim()) return null;
  return (
    <div className={cn("prose", className)}>
      <MDXRemote
        source={source}
        components={mdxComponents(baseUrl)}
        options={{ mdxOptions, parseFrontmatter: false }}
      />
    </div>
  );
}
