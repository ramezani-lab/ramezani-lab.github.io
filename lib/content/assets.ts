/**
 * Resolves an asset reference written in frontmatter.
 *
 * Relative paths (`./cover.png`, `img/a.png`) point at files beside the
 * document's `index.mdx`; `scripts/sync-assets.ts` copies those into
 * `public/content/<collection>/<slug>/`, which is where this maps them.
 * Absolute site paths and remote URLs are returned unchanged.
 */
export function resolveAsset(
  collection: string,
  slug: string,
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("/") || /^[a-z]+:/i.test(value)) return value;
  const relative = value.replace(/^\.\//, "");
  return `/content/${collection}/${slug}/${relative}`;
}
