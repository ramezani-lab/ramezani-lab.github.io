import type { CourseInput } from "@/lib/content/schema";

/**
 * Courses taught by lab faculty. Validated at build time.
 *
 * `offerings` are listed newest first; a `url` links to that term's course page.
 */
export const COURSES: CourseInput[] = [];
