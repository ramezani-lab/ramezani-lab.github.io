import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { courseSlug, getCourses, getDirector } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Teaching",
  description: `Courses taught by DAISY Lab faculty at ${SITE.university.name}.`,
  path: "/teaching",
});

const LEVELS = [
  { value: "graduate" as const, label: "Graduate courses" },
  { value: "undergraduate" as const, label: "Undergraduate courses" },
];

export default function TeachingPage() {
  const courses = getCourses();
  const director = getDirector();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHeader
        title="Teaching"
        lead={`Courses taught by ${director.name} in the ${SITE.department.name}.`}
      />

      {courses.length === 0 ? (
        <p className="py-16 text-sm text-muted-foreground">
          No courses listed yet.
        </p>
      ) : (
        <div className="divide-y">
          {LEVELS.map(({ value, label }) => {
            const group = courses.filter((course) => course.level === value);
            if (group.length === 0) return null;

            return (
              <section key={value} className="py-12">
                <h2 className="text-xl font-semibold tracking-tight">{label}</h2>
                <ul className="mt-6 divide-y">
                  {group.map((course) => (
                    <li
                      key={courseSlug(course)}
                      id={courseSlug(course)}
                      className="grid gap-x-10 gap-y-2 py-6 sm:grid-cols-[8rem_1fr]"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {course.code}
                      </span>
                      <div>
                        <h3 className="font-semibold leading-snug">{course.title}</h3>
                        {course.description ? (
                          <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
                            {course.description}
                          </p>
                        ) : null}
                        {course.offerings.length > 0 ? (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {course.offerings.map((offering) => (
                              <li key={offering.term}>
                                {offering.url ? (
                                  <a
                                    href={offering.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-primary hover:bg-primary-soft"
                                  >
                                    {offering.term}
                                  </a>
                                ) : (
                                  <span className="inline-block rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                                    {offering.term}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
