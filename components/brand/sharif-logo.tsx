import { assetPath } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Sharif University of Technology emblem.
 *
 * The official artwork is a single-colour emblem on a transparent ground, so
 * it is applied as a CSS mask and painted with `currentColor`: it reads as ink
 * on the cream theme and as paper on the dark one without a second file.
 */
export function SharifLogo({ className }: { className?: string }) {
  const url = `url(${assetPath("/img/sharif-emblem.png")})`;
  return (
    <span
      role="img"
      aria-label="Sharif University of Technology"
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
