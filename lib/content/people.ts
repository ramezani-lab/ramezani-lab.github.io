import type { Role } from "./schema";

/** Display order and headings for the people page. */
export const ROLE_GROUPS: ReadonlyArray<{ role: Role; label: string }> = [
  { role: "director", label: "Director" },
  { role: "postdoc", label: "Postdoctoral Researchers" },
  { role: "phd", label: "PhD Students" },
  { role: "msc", label: "MSc Students" },
  { role: "bsc", label: "Undergraduate Researchers" },
  { role: "alumni", label: "Alumni" },
];

/** Singular label for a person's role, used on cards and profiles. */
export const ROLE_LABELS: Record<Role, string> = {
  director: "Lab Director",
  postdoc: "Postdoctoral Researcher",
  phd: "PhD Student",
  msc: "MSc Student",
  bsc: "Undergraduate Researcher",
  alumni: "Alumni",
};

/** Programme names for alumni `degree`. */
export const DEGREE_LABELS = {
  postdoc: "Postdoc",
  phd: "PhD",
  msc: "MSc",
  bsc: "BSc",
} as const;

interface Groupable {
  name: string;
  role: Role;
  order: number;
  startYear?: number;
  endYear?: number;
}

function compareCurrent(a: Groupable, b: Groupable): number {
  return (
    a.order - b.order ||
    (a.startYear ?? Number.MAX_SAFE_INTEGER) -
      (b.startYear ?? Number.MAX_SAFE_INTEGER) ||
    a.name.localeCompare(b.name)
  );
}

function compareAlumni(a: Groupable, b: Groupable): number {
  return (b.endYear ?? 0) - (a.endYear ?? 0) || a.name.localeCompare(b.name);
}

/**
 * Groups people by role in display order. Current members sort by explicit
 * `order`, then seniority (earlier start first); alumni sort by most recent
 * departure. Empty groups are omitted.
 */
export function groupPeople<T extends Groupable>(
  people: T[],
): Array<{ role: Role; label: string; people: T[] }> {
  return ROLE_GROUPS.map(({ role, label }) => ({
    role,
    label,
    people: people
      .filter((person) => person.role === role)
      .sort(role === "alumni" ? compareAlumni : compareCurrent),
  })).filter((group) => group.people.length > 0);
}
