import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { DaisyMark } from "@/components/brand/daisy-mark";
import { SharifLogo } from "@/components/brand/sharif-logo";
import { NAV_ITEMS, SITE } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-footer text-footer-foreground">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1.2fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <DaisyMark className="size-10 text-footer-foreground" />
              <p className="text-xl font-bold tracking-tight">{SITE.name}</p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-footer-foreground/70">
              {SITE.tagline}. Part of the {SITE.department.name} at{" "}
              {SITE.university.name}.
            </p>
            <SharifLogo className="mt-6 size-14 text-footer-foreground/60" />
          </div>

          <nav aria-label="Footer">
            <p className="mb-4 text-sm font-semibold">Sections</p>
            <ul className="space-y-2.5 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-footer-foreground/70 transition-colors hover:text-footer-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-4 text-sm font-semibold">Contact</p>
            <ul className="space-y-3 text-sm text-footer-foreground/70">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-footer-foreground"
                >
                  <Mail className="size-4 shrink-0" />
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0" />
                {SITE.phone}
              </li>
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <address className="not-italic leading-relaxed">
                  {SITE.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-14 border-t border-footer-foreground/15 pt-6 text-xs text-footer-foreground/60">
          © {year} {SITE.fullName}, {SITE.university.name}.
        </p>
      </div>
    </footer>
  );
}
