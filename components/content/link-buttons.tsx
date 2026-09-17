import {
  BookOpen,
  Database,
  ExternalLink,
  FileText,
  Presentation,
  Video,
  type LucideIcon,
} from "lucide-react";
import { SiArxiv, SiGithub } from "@icons-pack/react-simple-icons";

import type { LinkType, PaperLink } from "@/lib/content";
import { cn } from "@/lib/utils";

type IconComponent = (props: { className?: string }) => React.ReactNode;

const META: Record<
  LinkType,
  { label: string; Icon: IconComponent | LucideIcon }
> = {
  paper: { label: "Paper", Icon: FileText },
  pdf: { label: "PDF", Icon: FileText },
  arxiv: { label: "arXiv", Icon: SiArxiv },
  doi: { label: "DOI", Icon: ExternalLink },
  code: { label: "Code", Icon: SiGithub },
  dataset: { label: "Dataset", Icon: Database },
  slides: { label: "Slides", Icon: Presentation },
  video: { label: "Video", Icon: Video },
  poster: { label: "Poster", Icon: Presentation },
  project: { label: "Project page", Icon: ExternalLink },
  publisher: { label: "Publisher", Icon: BookOpen },
};

/** Resource links for a paper, as a row of small labelled buttons. */
export function LinkButtons({
  links,
  className,
  size = "md",
}: {
  links: PaperLink[];
  className?: string;
  size?: "sm" | "md";
}) {
  if (links.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map((link) => {
        const { label, Icon } = META[link.type];
        return (
          <li key={`${link.type}-${link.url}`}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border bg-card font-medium transition-colors hover:border-primary hover:bg-primary-soft",
                size === "sm"
                  ? "px-2.5 py-1 text-xs"
                  : "px-3 py-1.5 text-[0.8125rem]",
              )}
            >
              <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
              {link.label ?? label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
