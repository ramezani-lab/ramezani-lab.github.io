import Link from "next/link";

import { DaisyMark } from "@/components/brand/daisy-mark";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start px-4 py-28">
      <DaisyMark className="size-16 text-muted-foreground/40" />
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">
        This page does not exist
      </h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        The address may have changed. Start from the publications or the people
        of the lab.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button render={<Link href="/papers">Browse publications</Link>} />
        <Button
          variant="outline"
          render={<Link href="/people">Meet the lab</Link>}
        />
      </div>

      <nav
        className="mt-14 flex flex-wrap gap-x-5 gap-y-2 text-sm"
        aria-label="Site"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
