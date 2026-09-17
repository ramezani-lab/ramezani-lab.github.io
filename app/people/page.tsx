import type { Metadata } from "next";
import Link from "next/link";

import { PersonCard, PersonPortrait } from "@/components/cards/person-card";
import { SocialLinks } from "@/components/content/social-links";
import { PageHeader } from "@/components/layout/page-header";
import { DEGREE_LABELS, getPeopleGroups, type Person } from "@/lib/content";
import { formatYearRange } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "People",
  description: `The members of ${SITE.fullName}: faculty, graduate and undergraduate researchers, and alumni.`,
  path: "/people",
});

/** The director gets a wide introduction rather than a tile in the grid. */
function DirectorCard({ person }: { person: Person }) {
  return (
    <div className="grid gap-8 sm:grid-cols-[13rem_1fr]">
      <Link href={person.url} className="group block max-w-[13rem]">
        <PersonPortrait
          person={person}
          className="transition-colors group-hover:border-primary"
        />
      </Link>
      <div>
        <h3 className="text-2xl font-semibold tracking-tight">
          <Link
            href={person.url}
            className="transition-colors hover:text-primary-ink"
          >
            {person.name}
          </Link>
        </h3>
        <p className="mt-1 text-muted-foreground">{person.title}</p>
        {person.summary ? (
          <p className="mt-4 max-w-2xl font-serif leading-relaxed">
            {person.summary}
          </p>
        ) : null}
        <SocialLinks
          socials={person.socials}
          email={person.email}
          size="sm"
          className="mt-5"
        />
      </div>
    </div>
  );
}

/** Alumni are a table: what they did here and where they went next. */
function AlumniTable({ people }: { people: Person[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-start text-xs text-muted-foreground">
            <th className="py-2 pe-4 text-start font-medium">Name</th>
            <th className="py-2 pe-4 text-start font-medium">Programme</th>
            <th className="py-2 pe-4 text-start font-medium">Years</th>
            <th className="py-2 text-start font-medium">Now</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id} className="border-b last:border-0">
              <td className="py-3 pe-4">
                <Link
                  href={person.url}
                  className="font-medium transition-colors hover:text-primary-ink"
                >
                  {person.name}
                </Link>
              </td>
              <td className="py-3 pe-4 text-muted-foreground">
                {person.degree ? DEGREE_LABELS[person.degree] : "—"}
              </td>
              <td className="py-3 pe-4 font-mono text-xs text-muted-foreground">
                {formatYearRange(person.startYear, person.endYear) || "—"}
              </td>
              <td className="py-3 text-muted-foreground">
                {person.nextPosition ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PeoplePage() {
  const groups = getPeopleGroups();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHeader
        title="People"
        lead="DAISY Lab is a small group of researchers working between machine learning and data systems, in the Department of Computer Engineering at Sharif University of Technology."
      />

      <div className="divide-y">
        {groups.map((group) => (
          <section key={group.role} className="py-12">
            <h2 className="text-xl font-semibold tracking-tight">
              {group.label}
            </h2>

            <div className="mt-8">
              {group.role === "director" ? (
                group.people.map((person) => (
                  <DirectorCard key={person.id} person={person} />
                ))
              ) : group.role === "alumni" ? (
                <AlumniTable people={group.people} />
              ) : (
                <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                  {group.people.map((person) => (
                    <li key={person.id}>
                      <PersonCard person={person} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
