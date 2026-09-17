import Link from "next/link";

import { DaisyMark } from "@/components/brand/daisy-mark";
import type { ResearchArea } from "@/lib/content";

/**
 * The lab's research areas drawn as nodes on the orbit from the logo.
 *
 * Six fixed positions around the ring; areas beyond the sixth fall back to the
 * list that the small-screen layout shows anyway. Rendered as SVG so the type
 * scales with the drawing and every node is a real link.
 */
const NODES = [
  { x: 380, y: 110, anchor: "middle" as const, lx: 380, ly: 82 },
  { x: 527.2, y: 195, anchor: "start" as const, lx: 545.2, ly: 195 },
  { x: 527.2, y: 365, anchor: "start" as const, lx: 545.2, ly: 365 },
  { x: 380, y: 450, anchor: "middle" as const, lx: 380, ly: 484 },
  { x: 232.8, y: 365, anchor: "end" as const, lx: 214.8, ly: 365 },
  { x: 232.8, y: 195, anchor: "end" as const, lx: 214.8, ly: 195 },
];

/** Splits a title into at most two balanced lines for the SVG label. */
function labelLines(title: string): string[] {
  const words = title.split(" ");
  if (title.length <= 22 || words.length < 3) return [title];

  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const first = words.slice(0, i).join(" ").length;
    const second = words.slice(i).join(" ").length;
    const diff = Math.abs(first - second);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

export function ResearchMap({ areas }: { areas: ResearchArea[] }) {
  const placed = areas.slice(0, NODES.length);

  return (
    <svg
      viewBox="10 40 740 480"
      className="daisy-map h-auto w-full"
      role="group"
      aria-label="Research areas"
    >
      {/* The orbit, open at the lower right exactly as the mark is. */}
      <path
        d="M 380 110 A 170 170 0 1 0 510.2 389.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="daisy-map-orbit text-border"
      />

      <foreignObject x="300" y="200" width="160" height="160">
        <DaisyMark className="size-40 text-foreground" />
      </foreignObject>

      {placed.map((area, index) => {
        const node = NODES[index];
        const lines = labelLines(area.title);
        return (
          <Link
            key={area.slug}
            href={area.url}
            className="daisy-map-node group"
          >
            {/* A transparent hit area keeps the whole label clickable. */}
            <rect
              x={
                node.anchor === "end"
                  ? node.lx - 220
                  : node.anchor === "start"
                    ? node.lx - 10
                    : node.lx - 110
              }
              y={node.ly - 26}
              width={node.anchor === "middle" ? 220 : 230}
              height="52"
              fill="transparent"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r="9"
              className="fill-background stroke-foreground transition-[fill] group-hover:fill-primary"
              strokeWidth="3"
            />
            <text
              x={node.lx}
              y={node.ly}
              textAnchor={node.anchor}
              className="fill-foreground text-[16px] font-medium transition-colors group-hover:fill-primary-ink"
            >
              {lines.map((line, lineIndex) => (
                <tspan
                  key={line}
                  x={node.lx}
                  dy={lineIndex === 0 ? (lines.length > 1 ? -8 : 0) : 19}
                >
                  {line}
                </tspan>
              ))}
            </text>
          </Link>
        );
      })}
    </svg>
  );
}
