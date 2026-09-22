import { describe, expect, it } from "vitest";
import { currentGameweekId, isoWeekId } from "./gameweek.ts";

describe("isoWeekId", () => {
  it("labels a mid-year Monday with its ISO week", () => {
    expect(isoWeekId(new Date("2025-09-15T00:00:00Z"))).toBe("2025-W38");
  });

  it("puts early January in week 1 of that year", () => {
    expect(isoWeekId(new Date("2025-01-01T00:00:00Z"))).toBe("2025-W01");
  });

  it("rolls late December into the next ISO year", () => {
    expect(isoWeekId(new Date("2025-12-29T00:00:00Z"))).toBe("2026-W01");
  });

  it("keeps a date in an earlier ISO year for the previous week", () => {
    expect(isoWeekId(new Date("2024-12-30T00:00:00Z"))).toBe("2025-W01");
  });
});

describe("currentGameweekId", () => {
  it("derives the Gameweek from the supplied clock", () => {
    expect(currentGameweekId(new Date("2025-09-15T12:00:00Z"))).toBe("2025-W38");
  });
});
