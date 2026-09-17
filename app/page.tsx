import Link from "next/link";

import { NewsCard } from "@/components/cards/news-card";
import { PaperCard } from "@/components/cards/paper-card";
import { PersonCard, PersonPortrait } from "@/components/cards/person-card";
import { SectionHeading } from "@/components/content/section-heading";
import { SocialLinks } from "@/components/content/social-links";
import { Hero } from "@/components/sections/hero";
import { Button } from "@/components/ui/button";
import {
  getAllAreas,
  getAllNews,
  getCurrentMembers,
  getDirector,
  getFeaturedPapers,
  getOpenPositions,
  getStats,
} from "@/lib/content";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

export default function HomePage() {
  const areas = getAllAreas();
  const featured = getFeaturedPapers(4);
  const news = getAllNews().slice(0, 3);
  const director = getDirector();
  const members = getCurrentMembers().filter(
    (person) => person.id !== director.id,
  );
  const positions = getOpenPositions();
  const stats = getStats();

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />

      <Hero areas={areas} />

      <section className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading
          title="Selected publications"
          description={`${stats.papers} papers across ${stats.areas} research directions.`}
          action={{ href: "/papers", label: "All publications" }}
        />
        <ul className="divide-y">
          {featured.map((paper) => (
            <li key={paper.slug}>
              <PaperCard paper={paper} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading
          title="The lab"
          description="A small group of researchers in the Department of Computer Engineering."
          action={{ href: "/people", label: "Everyone in the lab" }}
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[13rem_1fr] lg:gap-14">
          <div className="max-w-[13rem]">
            <Link href={director.url} className="group block">
              <PersonPortrait
                person={director}
                className="transition-colors group-hover:border-primary"
              />
            </Link>
            <h3 className="mt-3 font-medium">
              <Link
                href={director.url}
                className="transition-colors hover:text-primary-ink"
              >
                {director.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {director.title}
            </p>
            <SocialLinks
              socials={director.socials}
              email={director.email}
              size="sm"
              className="mt-3"
            />
          </div>

          {members.length > 0 ? (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {members.slice(0, 8).map((person) => (
                <li key={person.id}>
                  <PersonCard person={person} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {news.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <SectionHeading
            title="Latest news"
            action={{ href: "/news", label: "All news" }}
          />
          <ul className="divide-y">
            {news.map((item) => (
              <li key={item.slug}>
                <NewsCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {positions.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="rounded-xl border bg-card px-6 py-10 sm:px-10">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                We are looking for students
              </h2>
              <p className="mt-3 font-serif text-lg leading-relaxed text-muted-foreground">
                {positions.length} open position
                {positions.length === 1 ? "" : "s"} for students who want to
                work between machine learning and data systems at{" "}
                {SITE.university.name}.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button render={<Link href="/join">See open positions</Link>} />
                <Button
                  variant="outline"
                  render={<a href={`mailto:${SITE.email}`}>Email the lab</a>}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
