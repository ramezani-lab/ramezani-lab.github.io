import type { Metadata, Viewport } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeScript } from "@/components/layout/theme-script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fontVariables } from "@/lib/fonts";
import { absoluteUrl, ogImage } from "@/lib/seo";
import { SITE } from "@/lib/site";

import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.fullName,
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.fullName,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: absoluteUrl("/"),
    images: [
      {
        url: absoluteUrl(ogImage.default()),
        width: 1200,
        height: 630,
        alt: SITE.fullName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [absoluteUrl(ogImage.default())],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2eee5" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1d1b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">
        <TooltipProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
          >
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
