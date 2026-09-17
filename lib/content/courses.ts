import { slugify } from "../slug";
import type { Course } from "./schema";

/**
 * Anchor id for a course on the teaching page. Built from the code and title
 * together so two offerings of a course family stay distinguishable.
 */
export function courseSlug(course: Pick<Course, "code" | "title">): string {
  return slugify([course.code, course.title].filter(Boolean).join(" "));
}
