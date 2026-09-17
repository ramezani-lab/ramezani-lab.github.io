import { cn } from "@/lib/utils";

/** The eight petals, drawn once and rotated around the flower's centre. */
const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

interface DaisyMarkProps {
  className?: string;
  /** Slowly turns the orbit around the flower. Honours reduced motion. */
  animated?: boolean;
  title?: string;
}

/**
 * The DAISY mark: a daisy inside an open orbit with two data nodes.
 *
 * Redrawn from the supplied logo so it scales cleanly and follows the theme:
 * ink strokes use `currentColor`, petals use the card surface and the centre
 * uses `--primary`, so changing the brand colour recolours the mark too.
 */
export function DaisyMark({ className, animated = false, title }: DaisyMarkProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      <g
        className={cn(
          animated &&
            "origin-center motion-safe:animate-[spin_40s_linear_infinite]",
        )}
      >
        <path
          d="M 100 16 A 84 84 0 1 0 164.35 153.99"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="100" cy="16" r="11.5" fill="currentColor" />
        <circle cx="100" cy="184" r="11.5" fill="currentColor" />
      </g>
      <g
        transform="translate(100 100)"
        fill="var(--daisy-petal)"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      >
        {PETAL_ANGLES.map((angle) => (
          <rect
            key={angle}
            x="-10.5"
            y="-61"
            width="21"
            height="40"
            rx="10.5"
            transform={`rotate(${angle})`}
          />
        ))}
        <circle r="19" fill="var(--primary)" />
      </g>
    </svg>
  );
}
