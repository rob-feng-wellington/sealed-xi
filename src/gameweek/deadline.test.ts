import { describe, expect, it } from "vitest";
import {
  DEADLINE_LEAD_MINUTES,
  deadlineForGameweek,
  deadlineFromFirstKickoff,
  isPastDeadline,
  scheduledFirstKickoff,
} from "./deadline.ts";

describe("deadlineFromFirstKickoff", () => {
  it("locks 90 minutes before the first kickoff", () => {
    expect(DEADLINE_LEAD_MINUTES).toBe(90);
    const deadline = deadlineFromFirstKickoff(new Date("2025-09-20T12:30:00Z"));

    expect(deadline.toISOString()).toBe("2025-09-20T11:00:00.000Z");
  });
});

describe("isPastDeadline", () => {
  const deadline = new Date("2025-09-20T11:00:00Z");

  it("is false before the Deadline", () => {
    expect(isPastDeadline(new Date("2025-09-20T10:59:59Z"), deadline)).toBe(false);
  });

  it("is true at and after the Deadline", () => {
    expect(isPastDeadline(new Date("2025-09-20T11:00:00Z"), deadline)).toBe(true);
    expect(isPastDeadline(new Date("2025-09-20T11:00:01Z"), deadline)).toBe(true);
  });
});

describe("scheduledFirstKickoff", () => {
  it("places the Gameweek's first kickoff on its Saturday", () => {
    expect(scheduledFirstKickoff("2025-W38").toISOString()).toBe(
      "2025-09-20T12:30:00.000Z",
    );
  });

  it("rejects an unknown Gameweek id", () => {
    expect(() => scheduledFirstKickoff("nope")).toThrow();
  });

  it("derives the Deadline for the Gameweek", () => {
    expect(deadlineForGameweek("2025-W38").toISOString()).toBe(
      "2025-09-20T11:00:00.000Z",
    );
  });
});
