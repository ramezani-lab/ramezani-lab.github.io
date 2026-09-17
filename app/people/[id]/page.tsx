import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";

import { PersonPortrait } from "@/components/cards/person-card";
import { PaperCard } from "@/components/cards/paper-card";
import { SocialLinks } from "@/components/content/social-links";
import { MdxContent } from "@/components/mdx-content";
import {
  getAllPeople,
  getPerson,
  ROLE_LABELS,
  type Education,
  type Experience,
} from "@/lib/content";
import { formatDate, formatYearRange } from "@/lib/format";
import { buildMetadata, JsonLd, ogImage, personJsonLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPeople().map((person) => ({ id: person.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const person = getPerson(id);
  if (!person) return {};

  return buildMetadata({
    title: person.name,
    description:
      person.summary ||
      `${person.title ?? ROLE_LABELS[person.role]} at DAISY Lab, Sharif University of Technology.`,
    path: person.url,
    image: ogImage.person(person.id),
    type: "profile",
  });
}

function EducationList({ items }: { items: Education[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item, index) => (
        <li key={index} className="grid gap-x-6 sm:grid-cols-[5rem_1fr]">
          <span className="font-mono text-xs text-muted-foreground">{item.year}</span>
          <span>
            <span className="font-medium">
              {item.degree} in {item.field}
            </span>
            <span className="block text-sm text-muted-foreground">
              {item.institution}
              {item.note ? ` — ${item.note}` : ""}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function ExperienceList({ items }: { items: Experience[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item, index) => {
        const years = formatYearRange(item.start, item.end);
        return (
          <li key={index} className="grid gap-x-6 sm:grid-cols-[5rem_1fr]">
            <span className="font-mono text-xs text-muted-foreground">{years}</span>
            <span>
              <span className="font-medium">{item.role}</span>
              <span className="block text-sm text-muted-foreground">
                {item.organization}
              </span>
              {item.description ? (
                <span className="mt-1 block text-sm text-muted-foreground">
                  {item.description}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = getPerson(id);
  if (!person) notFound();

  const years = formatYearRange(person.startYear, person.endYear);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-14">
      <JsonLd
        data={personJsonLd({
          name: person.name,
          url: person.url,
          image: person.image,
          jobTitle: person.title ?? ROLE_LABELS[person.role],
          email: person.email,
          sameAs: Object.values(person.socials).filter(
            (value): value is string => typeof value === "string" && value.startsWith("http"),
          ),
          knowsAbout: person.interests,
        })}
      />

      <Link href="/people" className="link-underline text-sm text-muted-foreground">
        People
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="max-w-[16rem]">
            <PersonPortrait person={person} />
          </div>

          <div className="mt-6 space-y-3 text-sm">
            {person.email ? (
              <a
                href={`mailto:${person.email}`}
                className="flex items-center gap-2.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-4 shrink-0" />
                <span className="break-all">{person.email}</span>
              </a>
            ) : null}
            {person.phone ? (
              <p className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="size-4 shrink-0" />
                {person.phone}
              </p>
            ) : null}
            {person.office ? (
              <p className="flex gap-2.5 text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {person.office}
              </p>
            ) : null}
          </div>

          <SocialLinks socials={person.socials} size="sm" className="mt-5" />
        </div>

        <div className="min-w-0">
          <h1 className="text-4xl font-semibold tracking-tight">{person.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {person.title ?? ROLE_LABELS[person.role]}
          </p>
          {years ? (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              In the lab {years}
            </p>
          ) : null}
          {person.nextPosition ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Now: {person.nextPosition}
            </p>
          ) : null}

          {person.interests.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-1.5">
              {person.interests.map((interest) => (
                <li
                  key={interest}
                  className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium"
                >
                  {interest}
                </li>
              ))}
            </ul>
          ) : null}

          <MdxContent
            source={person.body}
            baseUrl={`/content/people/${person.id}`}
            className="mt-10"
          />

          {person.areas.length > 0 ? (
            <section className="mt-14">
              <h2 className="text-xl font-semibold tracking-tight">Research areas</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {person.areas.map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={area.url}
                      className="inline-block rounded-md border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-primary-soft"
                    >
                      {area.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {person.education.length > 0 ? (
            <section className="mt-14">
              <h2 className="text-xl font-semibold tracking-tight">Education</h2>
              <div className="mt-5">
                <EducationList items={person.education} />
              </div>
            </section>
          ) : null}

          {person.experience.length > 0 ? (
            <section className="mt-14">
              <h2 className="text-xl font-semibold tracking-tight">Experience</h2>
              <div className="mt-5">
                <ExperienceList items={person.experience} />
              </div>
            </section>
          ) : null}

          {person.papers.length > 0 ? (
            <section className="mt-14">
              <h2 className="text-xl font-semibold tracking-tight">
                Publications ({person.papers.length})
              </h2>
              <ul className="mt-2 divide-y">
                {person.papers.map((paper) => (
                  <li key={paper.slug}>
                    <PaperCard paper={paper} highlight={person.id} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {person.news.length > 0 ? (
            <section className="mt-14 pb-4">
              <h2 className="text-xl font-semibold tracking-tight">In the news</h2>
              <ul className="mt-4 space-y-3">
                {person.news.map((item) => (
                  <li key={item.slug} className="flex flex-wrap gap-x-4 text-sm">
                    <time
                      dateTime={item.date}
                      className="shrink-0 font-mono text-xs text-muted-foreground"
                    >
                      {formatDate(item.date)}
                    </time>
                    <Link
                      href={item.url}
                      className="font-medium transition-colors hover:text-primary-ink"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
