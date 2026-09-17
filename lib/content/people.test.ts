import { describe, expect, it } from "vitest";

import { groupPeople } from "./people";
import type { Role } from "./schema";

const person = (name: string, role: Role, extra = {}) => ({
  name,
  role,
  order: 100,
  ...extra,
});

describe("groupPeople", () => {
  it("orders groups director → alumni and omits empty ones", () => {
    const groups = groupPeople([
      person("S", "msc"),
      person("D", "director"),
      person("Z", "alumni", { endYear: 2024 }),
    ]);
    expect(groups.map((group) => group.role)).toEqual([
      "director",
      "msc",
      "alumni",
    ]);
  });

  it("labels groups for display", () => {
    const [group] = groupPeople([person("A", "bsc")]);
    expect(group.label).toBe("Undergraduate Researchers");
  });

  it("sorts current members by order, then start year, then name", () => {
    const [group] = groupPeople([
      person("B", "phd", { startYear: 2023 }),
      person("A", "phd", { startYear: 2023 }),
      person("Y", "phd", { startYear: 2021 }),
      person("C", "phd", { order: 1 }),
    ]);
    expect(group.people.map((p) => p.name)).toEqual(["C", "Y", "A", "B"]);
  });

  it("sorts alumni by most recent end year", () => {
    const [group] = groupPeople([
      person("Old", "alumni", { endYear: 2020 }),
      person("New", "alumni", { endYear: 2025 }),
    ]);
    expect(group.people.map((p) => p.name)).toEqual(["New", "Old"]);
  });
});
