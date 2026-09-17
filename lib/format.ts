/** Parses `YYYY-MM-DD` as a UTC date so formatting never shifts the day. */
function parseIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

const LONG = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "May 1, 2025" */
export function formatDate(iso: string): string {
  return LONG.format(parseIso(iso));
}

/** "May 2025" */
export function formatMonthYear(iso: string): string {
  return MONTH_YEAR.format(parseIso(iso));
}

/** "2021–2024", "2023–present"; empty when neither year is known. */
export function formatYearRange(
  start?: number | string,
  end?: number | string,
): string {
  if (start === undefined && end === undefined) return "";
  if (end === undefined) return `${start}–present`;
  return `${start ?? ""}–${end}`;
}
