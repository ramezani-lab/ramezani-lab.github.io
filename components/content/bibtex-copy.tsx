"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

/** BibTeX entry with a copy button; falls back to selectable text. */
export function BibtexBlock({ bibtex }: { bibtex: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bibtex);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative">
      <pre className="scroll-subtle overflow-x-auto rounded-lg border bg-card p-4 pe-28 font-mono text-xs leading-relaxed">
        {bibtex}
      </pre>
      <Button
        size="sm"
        variant="outline"
        onClick={copy}
        className="absolute end-3 top-3"
        aria-label="Copy BibTeX entry"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
