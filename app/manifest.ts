import type { MetadataRoute } from "next";

import { assetPath, SITE } from "@/lib/site";

// Required for output: "export" — generated once at build time.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.fullName,
    short_name: SITE.name,
    description: SITE.description,
    start_url: assetPath("/"),
    display: "standalone",
    lang: "en",
    dir: "ltr",
    background_color: "#f2eee5",
    theme_color: "#f2c434",
    icons: [
      { src: assetPath("/img/logo.svg"), sizes: "any", type: "image/svg+xml" },
    ],
  };
}
