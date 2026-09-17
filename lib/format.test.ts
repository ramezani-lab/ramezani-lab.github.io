import { describe, expect, it } from "vitest";

import { formatDate, formatMonthYear, formatYearRange } from "./format";

describe("formatDate", () => {
  it("renders ISO dates in long English form without timezone drift", () => {
    expect(formatDate("2025-05-01")).toBe("May 1, 2025");
    expect(formatDate("2024-12-31")).toBe("December 31, 2024");
  });
});

describe("formatMonthYear", () => {
  it("renders month and year", () => {
    expect(formatMonthYear("2025-01-15")).toBe("January 2025");
  });
});

describe("formatYearRange", () => {
  it("joins start and end with an en dash", () => {
    expect(formatYearRange(2021, 2024)).toBe("2021–2024");
    expect(formatYearRange(2023)).toBe("2023–present");
    expect(formatYearRange(undefined, 2020)).toBe("–2020");
    expect(formatYearRange()).toBe("");
  });
});
