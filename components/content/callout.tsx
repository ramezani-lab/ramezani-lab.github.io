import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertTriangle,
  Info,
  Lightbulb,
  OctagonAlert,
  StickyNote,
} from "lucide-react";

import { cn } from "@/lib/utils";

const callout = cva(
  "not-prose my-6 rounded-lg border border-s-[3px] px-4 py-3 font-sans text-[0.95rem] leading-relaxed [&_p+p]:mt-2",
  {
    variants: {
      type: {
        note: "border-border border-s-muted-foreground bg-muted/60",
        info: "border-border border-s-foreground bg-card",
        tip: "border-border border-s-primary bg-primary-soft",
        warning:
          "border-border border-s-[oklch(0.72_0.15_60)] bg-[oklch(0.72_0.15_60/0.08)]",
        danger: "border-destructive/25 border-s-destructive bg-destructive/[0.06]",
      },
    },
    defaultVariants: { type: "note" },
  },
);

const ICONS = {
  note: StickyNote,
  info: Info,
  tip: Lightbulb,
  warning: AlertTriangle,
  danger: OctagonAlert,
} as const;

const DEFAULT_TITLES: Record<keyof typeof ICONS, string> = {
  note: "Note",
  info: "Info",
  tip: "Tip",
  warning: "Warning",
  danger: "Important",
};

export interface CalloutProps extends VariantProps<typeof callout> {
  title?: string;
  children?: ReactNode;
  className?: string;
}

/** Highlighted aside for MDX content: `<Callout type="tip" title="…">`. */
export function Callout({ type, title, children, className }: CalloutProps) {
  const key = (type ?? "note") as keyof typeof ICONS;
  const Icon = ICONS[key];

  return (
    <aside className={cn(callout({ type }), className)}>
      <p className="mb-1 flex items-center gap-2 font-semibold">
        <Icon className="size-4 shrink-0" aria-hidden />
        {title?.trim() || DEFAULT_TITLES[key]}
      </p>
      <div className="text-foreground/90">{children}</div>
    </aside>
  );
}
