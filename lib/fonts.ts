import localFont from "next/font/local";

/**
 * Instrument Sans carries the interface and headings: a contemporary grotesk
 * close in spirit to the DAISY wordmark, with a width axis for tight display
 * settings.
 */
export const instrumentSans = localFont({
  src: [
    { path: "../public/fonts/InstrumentSans-VF.woff2", style: "normal" },
    { path: "../public/fonts/InstrumentSans-Italic-VF.woff2", style: "italic" },
  ],
  variable: "--font-instrument-sans",
  display: "swap",
  weight: "400 700",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/**
 * Newsreader sets long-form reading — abstracts, biographies, paper bodies —
 * where a text serif gives the site its academic register.
 */
export const newsreader = localFont({
  src: [
    { path: "../public/fonts/Newsreader-VF.woff2", style: "normal" },
    { path: "../public/fonts/Newsreader-Italic-VF.woff2", style: "italic" },
  ],
  variable: "--font-newsreader",
  display: "swap",
  weight: "200 800",
  fallback: ["Georgia", "ui-serif", "serif"],
});

/** Reserved for BibTeX, code, and tabular metadata such as years. */
export const jetbrainsMono = localFont({
  src: "../public/fonts/JetBrainsMono-VF.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: "400 700",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

export const fontVariables = `${instrumentSans.variable} ${newsreader.variable} ${jetbrainsMono.variable}`;
