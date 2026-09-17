import type { Metadata } from "next";

import { assetPath, SITE } from "./site";

/**
 * Absolute canonical URL for a site path. The export uses trailing slashes, so
 * page paths get one; files (with an extension) and fragments do not.
 */
export function absoluteUrl(path: string): string {
  const [pathname, hash] = path.split("#");
  let clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!clean.endsWith("/") && !/\.[a-z0-9]+$/i.test(clean)) clean += "/";
  return `${SITE.url}${assetPath(clean)}${hash ? `#${hash}` : ""}`;
}

/** Build-time Open Graph images, produced by scripts/generate-og.ts. */
export const ogImage = {
  default: () => "/og/default.png",
  paper: (slug: string) => `/og/paper-${slug}.png`,
  person: (id: string) => `/og/person-${id}.png`,
  news: (slug: string) => `/og/news-${slug}.png`,
};

interface MetadataInput {
  title: string;
  description?: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  authors?: string[];
  tags?: string[];
}

/** Page metadata with canonical URL, Open Graph and Twitter cards. */
export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  authors,
  tags,
}: MetadataInput): Metadata {
  const url = absoluteUrl(path);
  const resolvedDescription = description?.trim() || SITE.description;
  const images = [
    {
      url: absoluteUrl(image ?? ogImage.default()),
      width: 1200,
      height: 630,
      alt: title,
    },
  ];

  return {
    title,
    description: resolvedDescription,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: SITE.locale,
      siteName: SITE.fullName,
      title,
      description: resolvedDescription,
      url,
      images,
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors ? { authors } : {}),
      ...(tags ? { tags } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: resolvedDescription,
      images: images.map((entry) => entry.url),
    },
  };
}

const organizationRef = () => ({
  "@type": "ResearchOrganization" as const,
  name: SITE.fullName,
  url: absoluteUrl("/"),
});

/** Lab identity, emitted once on the home page. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    ...organizationRef(),
    alternateName: SITE.name,
    logo: absoluteUrl("/img/logo.svg"),
    email: SITE.email,
    telephone: SITE.phone,
    description: SITE.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.slice(0, 2).join(", "),
      addressLocality: "Tehran",
      addressCountry: "IR",
    },
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: SITE.university.name,
      url: SITE.university.url,
      department: { "@type": "Organization", name: SITE.department.name },
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite" as const,
    name: SITE.fullName,
    url: absoluteUrl("/"),
    inLanguage: "en",
    publisher: organizationRef(),
  };
}

export function personJsonLd(input: {
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  email?: string;
  sameAs?: string[];
  knowsAbout?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person" as const,
    name: input.name,
    url: absoluteUrl(input.url),
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    ...(input.email ? { email: `mailto:${input.email}` } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    ...(input.knowsAbout?.length ? { knowsAbout: input.knowsAbout } : {}),
    affiliation: organizationRef(),
    worksFor: {
      "@type": "CollegeOrUniversity" as const,
      name: SITE.university.name,
    },
  };
}

export function scholarlyArticleJsonLd(input: {
  title: string;
  abstract: string;
  url: string;
  year: number;
  date?: string;
  authors: Array<{ name: string; url?: string }>;
  venue: string;
  tags: string[];
  image?: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle" as const,
    headline: input.title,
    name: input.title,
    abstract: input.abstract,
    url: absoluteUrl(input.url),
    datePublished: input.date ?? String(input.year),
    author: input.authors.map((author) => ({
      "@type": "Person" as const,
      name: author.name,
      ...(author.url ? { url: absoluteUrl(author.url) } : {}),
    })),
    isPartOf: { "@type": "Periodical" as const, name: input.venue },
    ...(input.tags.length ? { keywords: input.tags.join(", ") } : {}),
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    publisher: organizationRef(),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList" as const,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

/** Renders a JSON-LD script tag. `<` is escaped so content cannot close it. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
