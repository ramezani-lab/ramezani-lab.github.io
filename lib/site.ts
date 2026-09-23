/** Normalizes `NEXT_PUBLIC_BASE_PATH` to "" or "/segment" (no trailing slash). */
export function normalizeBasePath(raw: string | undefined): string {
  const value = raw?.trim() ?? "";
  if (!value || value === "/") return "";
  const withLeading = value.startsWith("/") ? value : `/${value}`;
  return withLeading.replace(/\/+$/, "");
}

export const BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/**
 * Prefixes a site-relative asset URL with the base path.
 *
 * `next/link` applies the base path itself, but raw URLs — `fetch`, `<img>`,
 * CSS masks — do not, so anything under `public/` goes through here.
 */
export function assetPath(path: string, base: string = BASE_PATH): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  return `${base}${path}`;
}

export const SITE = {
  name: "DAISY Lab",
  shortName: "DAISY",
  fullName: "DAISY Lab — Data-Centric AI Systems",
  tagline: "Data-Centric AI Systems",
  description:
    "DAISY Lab studies data-centric AI systems at Sharif University of Technology: machine learning for systems, systems for machine learning, database optimization, Text-to-SQL, AI agents, and complex networks.",
  mission:
    "We build AI systems that treat data as a first-class citizen — learning to optimize databases and infrastructure, making data accessible through natural language, and understanding the networks that data lives in.",
  url: (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://daisy-lab.github.io"
  ).replace(/\/+$/, ""),
  locale: "en_US",
  email: "maryam.ramezani@sharif.edu",
  phone: "+98 21 6616 6654",
  address: [
    "Room 821, Department of Computer Engineering",
    "Sharif University of Technology",
    "Azadi Avenue, Tehran, Iran",
  ],
  mapUrl:
    "https://www.openstreetmap.org/search?query=Sharif%20University%20of%20Technology%20Computer%20Engineering",
  department: {
    name: "Department of Computer Engineering",
    url: "https://ce.sharif.edu",
  },
  university: {
    name: "Sharif University of Technology",
    url: "https://www.sharif.edu",
  },
  socials: {
    github: undefined as string | undefined,
    linkedin: undefined as string | undefined,
    x: undefined as string | undefined,
  },
} as const;

export const NAV_ITEMS = [
  { href: "/research", label: "Research" },
  { href: "/papers", label: "Publications" },
  { href: "/people", label: "People" },
  { href: "/news", label: "News" },
  { href: "/teaching", label: "Teaching" },
  { href: "/join", label: "Join Us" },
] as const;
