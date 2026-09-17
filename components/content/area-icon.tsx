import {
  Bot,
  Cpu,
  Database,
  Server,
  Share2,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/** Icons a research area may name in `icon:`. */
const ICONS: Record<string, LucideIcon> = {
  database: Database,
  cpu: Cpu,
  server: Server,
  bot: Bot,
  "share-2": Share2,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
};

export function AreaIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
