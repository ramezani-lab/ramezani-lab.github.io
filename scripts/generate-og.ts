/**
 * Renders an Open Graph image for the site, every paper, every person and
 * every news item.
 *
 * A static export cannot run dynamic `opengraph-image` routes, so the cards are
 * produced here with Satori and written to public/og/.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

import {
  getAllNews,
  getAllPapers,
  getAllPeople,
  ROLE_LABELS,
} from "../lib/content";
import { formatDate } from "../lib/format";
import { SITE } from "../lib/site";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT_DIR = join(ROOT, "public", "og");
const PUBLIC_DIR = join(ROOT, "public");

const WIDTH = 1200;
const HEIGHT = 630;

/** Matches the light theme tokens in app/globals.css. */
const COLORS = {
  background: "#f2eee5",
  card: "#fbf9f5",
  foreground: "#3a3832",
  ink: "#26251f",
  muted: "#78746a",
  border: "#ddd6c7",
  brand: "#f2c434",
};

type Element = {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
};

const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra: Record<string, unknown> = {},
): Element => ({ type, props: { style, children, ...extra } });

function loadFont(name: string, weight: number): Buffer {
  return readFileSync(join(ROOT, "assets", "fonts", `${name}-${weight}.woff`));
}

/** Loads a public/ asset as a data URI for Satori's `<img src>`. */
function loadImage(publicPath?: string): string | undefined {
  if (!publicPath?.startsWith("/")) return undefined;
  const extension = publicPath.split(".").pop()?.toLowerCase();
  if (
    !extension ||
    !["png", "jpg", "jpeg", "gif", "webp"].includes(extension)
  ) {
    return undefined;
  }
  try {
    const buffer = readFileSync(join(PUBLIC_DIR, publicPath.slice(1)));
    const mime = extension === "jpg" ? "jpeg" : extension;
    return `data:image/${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

/** The DAISY mark, inlined so the card carries the lab's identity. */
const MARK = readFileSync(join(PUBLIC_DIR, "img", "logo.svg"), "utf8");
const MARK_URI = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`;

interface CardInput {
  kind: string;
  title: string;
  subtitle?: string;
  meta?: string;
  /** Portrait or cover shown on the right. */
  image?: string;
  imageRound?: boolean;
}

function card({
  kind,
  title,
  subtitle,
  meta,
  image,
  imageRound,
}: CardInput): Element {
  const titleSize = title.length > 90 ? 44 : title.length > 55 ? 52 : 62;
  const textWidth = image ? 640 : 1000;

  const column: unknown[] = [
    el(
      "div",
      {
        display: "flex",
        fontSize: 22,
        color: COLORS.muted,
        letterSpacing: 0.5,
      },
      kind,
    ),
    el(
      "div",
      {
        display: "flex",
        marginTop: 18,
        fontSize: titleSize,
        fontWeight: 600,
        lineHeight: 1.18,
        color: COLORS.ink,
        letterSpacing: -1,
      },
      title.length > 150 ? `${title.slice(0, 150)}…` : title,
    ),
  ];

  if (subtitle) {
    column.push(
      el(
        "div",
        {
          display: "flex",
          marginTop: 22,
          fontSize: 26,
          lineHeight: 1.4,
          color: COLORS.muted,
          fontFamily: "Newsreader",
        },
        subtitle.length > 130 ? `${subtitle.slice(0, 130)}…` : subtitle,
      ),
    );
  }

  const body: unknown[] = [
    el(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        width: textWidth,
        justifyContent: "center",
      },
      column,
    ),
  ];

  if (image) {
    body.push(
      el(
        "img",
        {
          width: 300,
          height: 300,
          objectFit: "cover",
          borderRadius: imageRound ? 150 : 16,
          border: `1px solid ${COLORS.border}`,
        },
        undefined,
        { src: image },
      ),
    );
  }

  return el(
    "div",
    {
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundColor: COLORS.background,
      padding: "64px 72px",
      fontFamily: "Instrument Sans",
      borderTop: `12px solid ${COLORS.brand}`,
    },
    [
      el(
        "div",
        {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 48,
          flex: 1,
        },
        body,
      ),
      el(
        "div",
        {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: 24,
        },
        [
          el("img", { width: 44, height: 44 }, undefined, { src: MARK_URI }),
          el(
            "div",
            {
              display: "flex",
              fontSize: 24,
              fontWeight: 600,
              color: COLORS.foreground,
            },
            SITE.fullName,
          ),
          el(
            "div",
            {
              display: "flex",
              marginLeft: "auto",
              fontSize: 20,
              color: COLORS.muted,
            },
            meta ?? SITE.university.name,
          ),
        ],
      ),
    ],
  );
}

const fonts = [
  {
    name: "Instrument Sans",
    data: loadFont("InstrumentSans", 400),
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "Instrument Sans",
    data: loadFont("InstrumentSans", 600),
    weight: 600 as const,
    style: "normal" as const,
  },
  {
    name: "Newsreader",
    data: loadFont("Newsreader", 400),
    weight: 400 as const,
    style: "normal" as const,
  },
];

async function render(input: CardInput, file: string) {
  const svg = await satori(card(input) as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } })
    .render()
    .asPng();
  writeFileSync(join(OUT_DIR, file), png);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  let count = 0;

  await render(
    {
      kind: SITE.tagline,
      title: "Data-centric AI systems, built to survive real data.",
      subtitle: SITE.mission,
    },
    "default.png",
  );
  count++;

  for (const paper of getAllPapers()) {
    await render(
      {
        kind: paper.venue.name,
        title: paper.title,
        subtitle: paper.authors
          .map((author) =>
            author.kind === "member" ? author.person.name : author.name,
          )
          .join(", "),
        meta: String(paper.year),
        image: loadImage(paper.cover),
      },
      `paper-${paper.slug}.png`,
    );
    count++;
  }

  for (const person of getAllPeople()) {
    await render(
      {
        kind: person.title ?? ROLE_LABELS[person.role],
        title: person.name,
        subtitle: person.summary || person.interests.slice(0, 3).join(" · "),
        meta:
          person.papers.length > 0
            ? `${person.papers.length} publications`
            : undefined,
        image: loadImage(person.image),
        imageRound: true,
      },
      `person-${person.id}.png`,
    );
    count++;
  }

  for (const item of getAllNews()) {
    await render(
      {
        kind: "News",
        title: item.title,
        subtitle: item.summary,
        meta: formatDate(item.date),
        image: loadImage(item.cover),
      },
      `news-${item.slug}.png`,
    );
    count++;
  }

  console.log(`Generated ${count} Open Graph images`);
}

void main();
