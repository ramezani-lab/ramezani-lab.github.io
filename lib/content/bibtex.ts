import type { PaperLink, Venue } from "./schema";

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "in",
  "of",
  "on",
  "the",
  "to",
  "toward",
  "towards",
  "via",
  "with",
]);

/** Lowercase ASCII letters and digits only, with accents folded away. */
function keyPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Conventional citation key: `surname` + `year` + first significant word. */
export function bibtexKey(authors: string[], year: number, title: string): string {
  const surname = keyPart(authors[0]?.trim().split(/\s+/).pop() ?? "anon");
  const word =
    title
      .split(/[\s:—–-]+/)
      .map(keyPart)
      .find((part) => part && !STOPWORDS.has(part)) ?? "paper";
  return `${surname || "anon"}${year}${word}`;
}

function doiFrom(links: PaperLink[]): string | undefined {
  const link = links.find((item) => item.type === "doi");
  return link?.url.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
}

function arxivIdFrom(links: PaperLink[]): string | undefined {
  const link = links.find((item) => item.type === "arxiv");
  const match = link?.url.match(
    /arxiv\.org\/(?:abs|pdf)\/([^\s?#]+?)(?:v\d+)?(?:\.pdf)?$/i,
  );
  return match?.[1];
}

function primaryUrl(links: PaperLink[]): string | undefined {
  const order: PaperLink["type"][] = ["paper", "publisher", "arxiv", "pdf", "doi"];
  for (const type of order) {
    const link = links.find((item) => item.type === type);
    if (link) return link.url;
  }
  return undefined;
}

export interface BibtexInput {
  title: string;
  authors: string[];
  year: number;
  venue: Pick<Venue, "name" | "type">;
  links: PaperLink[];
}

/**
 * Builds a BibTeX entry from paper metadata, so authors only write one by hand
 * when they need something this cannot express.
 */
export function buildBibtex({ title, authors, year, venue, links }: BibtexInput): string {
  const fields: Array<[string, string]> = [
    // Double braces keep acronyms like "SQL" from being lowercased by styles.
    ["title", `{${title}}`],
    ["author", authors.join(" and ")],
  ];

  let type: string;
  const arxivId = arxivIdFrom(links);

  switch (venue.type) {
    case "journal":
      type = "article";
      fields.push(["journal", venue.name]);
      break;
    case "conference":
    case "workshop":
      type = "inproceedings";
      fields.push(["booktitle", venue.name]);
      break;
    case "book":
      type = "incollection";
      fields.push(["booktitle", venue.name]);
      break;
    case "preprint":
      type = "misc";
      if (arxivId) {
        fields.push(["eprint", arxivId], ["archivePrefix", "arXiv"]);
      } else {
        fields.push(["howpublished", venue.name]);
      }
      break;
  }

  fields.push(["year", String(year)]);

  const doi = doiFrom(links);
  if (doi) fields.push(["doi", doi]);

  const url = primaryUrl(links);
  if (url) fields.push(["url", url]);

  const body = fields.map(([name, value]) => `  ${name} = {${value}}`).join(",\n");
  return `@${type}{${bibtexKey(authors, year, title)},\n${body}\n}`;
}
