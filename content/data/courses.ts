import type { CourseInput } from "@/lib/content/schema";

/**
 * Courses taught by lab faculty. Validated at build time.
 *
 * List `offerings` newest first; `url` links to that term's course page.
 * The entries below are samples — replace them with real courses.
 */
export const COURSES: CourseInput[] = [
  {
    code: "CE-XXX",
    title: "Sample graduate course",
    level: "graduate",
    description:
      "Sample entry so the Teaching page has something to show. Replace it with a real course and its description.",
    offerings: [{ term: "Fall 2026" }, { term: "Fall 2025" }],
  },
  {
    code: "CE-XXX",
    title: "Sample undergraduate course",
    level: "undergraduate",
    description:
      "Sample entry so the Teaching page has something to show. Replace it with a real course and its description.",
    offerings: [{ term: "Spring 2026" }],
  },
];
