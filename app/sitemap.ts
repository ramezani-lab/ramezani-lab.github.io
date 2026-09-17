import type { MetadataRoute } from "next";

import {
  getAllAreas,
  getAllNews,
  getAllPapers,
  getAllPeople,
  getAllTags,
} from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

// Required for output: "export" — generated once at build time.
export const dynamic = "force-static";

/** Every route, enumerated from the content graph. */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), priority: 1, changeFrequency: "weekly" },
    { url: absoluteUrl("/research"), priority: 0.9, changeFrequency: "monthly" },
    { url: absoluteUrl("/papers"), priority: 0.9, changeFrequency: "monthly" },
    { url: absoluteUrl("/people"), priority: 0.8, changeFrequency: "monthly" },
    { url: absoluteUrl("/news"), priority: 0.7, changeFrequency: "weekly" },
    { url: absoluteUrl("/teaching"), priority: 0.5, changeFrequency: "yearly" },
    { url: absoluteUrl("/join"), priority: 0.7, changeFrequency: "monthly" },
    { url: absoluteUrl("/tags"), priority: 0.4, changeFrequency: "monthly" },
  ];
  const staticRoutes: MetadataRoute.Sitemap = pages.map((entry) => ({
    ...entry,
    lastModified: today,
  }));

  return [
    ...staticRoutes,
    ...getAllAreas().map((area) => ({
      url: absoluteUrl(area.url),
      lastModified: today,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getAllPapers().map((paper) => ({
      url: absoluteUrl(paper.url),
      lastModified: paper.date ? new Date(paper.date) : today,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    ...getAllPeople().map((person) => ({
      url: absoluteUrl(person.url),
      lastModified: today,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...getAllNews().map((item) => ({
      url: absoluteUrl(item.url),
      lastModified: new Date(item.date),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    ...getAllTags().map((tag) => ({
      url: absoluteUrl(tag.url),
      lastModified: today,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
