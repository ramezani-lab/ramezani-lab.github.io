import { assetPath } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Resolves a co-located `./img/x.png` reference against the document's assets. */
export function resolveMdxSrc(src: string, baseUrl?: string): string {
  if (/^([a-z]+:)?\/\//i.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/")) return assetPath(src);
  const clean = src.replace(/^\.\//, "");
  return assetPath(baseUrl ? `${baseUrl}/${clean}` : `/${clean}`);
}

interface FigureProps {
  src?: string;
  alt?: string;
  /** Caption below the image; markdown `![alt](src "title")` maps here. */
  caption?: string;
  title?: string;
  baseUrl?: string;
  className?: string;
}

/** Block-level image with an optional caption. Used for markdown images too. */
export function Figure({
  src,
  alt,
  caption,
  title,
  baseUrl,
  className,
}: FigureProps) {
  if (!src) return null;
  const text = caption ?? title;

  return (
    <figure className="my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolveMdxSrc(src, baseUrl)}
        alt={alt ?? ""}
        loading="lazy"
        className={cn("h-auto w-full rounded-lg border bg-card", className)}
      />
      {text ? <figcaption>{text}</figcaption> : null}
    </figure>
  );
}
