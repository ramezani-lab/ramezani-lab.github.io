import { FileText, Globe, Mail } from "lucide-react";
import {
  SiClarivate,
  SiDblp,
  SiGithub,
  SiGooglescholar,
  SiOrcid,
  SiResearchgate,
  SiScopus,
  SiX,
} from "@icons-pack/react-simple-icons";

import { LinkedInIcon } from "@/components/icons/linkedin";
import type { Socials } from "@/lib/content";
import { assetPath } from "@/lib/site";
import { cn } from "@/lib/utils";

type IconComponent = (props: { className?: string }) => React.ReactNode;

/** Display order matches how researchers are usually looked up. */
const CHANNELS: Array<{
  key: keyof Socials | "email";
  label: string;
  Icon: IconComponent;
}> = [
  { key: "email", label: "Email", Icon: Mail },
  { key: "scopus", label: "Scopus", Icon: SiScopus },
  { key: "scholar", label: "Google Scholar", Icon: SiGooglescholar },
  { key: "researcherid", label: "ResearcherID", Icon: SiClarivate },
  { key: "orcid", label: "ORCID", Icon: SiOrcid },
  { key: "researchgate", label: "ResearchGate", Icon: SiResearchgate },
  { key: "github", label: "GitHub", Icon: SiGithub },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "x", label: "X", Icon: SiX },
  { key: "dblp", label: "DBLP", Icon: SiDblp },
  { key: "website", label: "Personal website", Icon: Globe },
  { key: "cv", label: "CV", Icon: FileText },
];

interface SocialLinksProps {
  socials?: Socials;
  email?: string;
  className?: string;
  size?: "sm" | "md";
}

/** Contact and profile links for a person, as labelled icon buttons. */
export function SocialLinks({
  socials,
  email,
  className,
  size = "md",
}: SocialLinksProps) {
  const entries = CHANNELS.flatMap(({ key, label, Icon }) => {
    const value = key === "email" ? email : socials?.[key];
    if (!value) return [];
    const href =
      key === "email"
        ? `mailto:${value}`
        : key === "cv" && value.startsWith("/")
          ? assetPath(value)
          : value;
    return [{ key, label, Icon, href, external: key !== "email" }];
  });

  if (entries.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {entries.map(({ key, label, Icon, href, external }) => (
        <li key={key}>
          <a
            href={href}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            aria-label={label}
            title={label}
            className={cn(
              "flex items-center justify-center rounded-md border text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft hover:text-foreground",
              size === "sm" ? "size-7" : "size-9",
            )}
          >
            <Icon className={size === "sm" ? "size-3.5" : "size-4"} />
          </a>
        </li>
      ))}
    </ul>
  );
}
