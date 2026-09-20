import { describe, expect, it } from "vitest";
import { settleMatchPoints } from "./settle-match-points.ts";

const zeroMatchFacts = {
  minutes: 0,
  goals: 0,
  assists: 0,
  yellows: 0,
  reds: 0,
  goalsConcededByClub: 0,
  ownGoals: 0,
} as const;

describe("settleMatchPoints", () => {
  it("gives 1 appearance when the footballer plays at least one minute this Gameweek", () => {
    const result = settleMatchPoints(
      { position: "MID" },
      [{ ...zeroMatchFacts, minutes: 1, goalsConcededByClub: 2 }],
    );

    expect(result.total).toBe(1);
  });

  it("gives 0 appearance when the footballer records 0 minutes this Gameweek", () => {
    const result = settleMatchPoints({ position: "MID" }, [{ ...zeroMatchFacts }]);

    expect(result.total).toBe(0);
  });

  it("still gives 1 appearance across a Double", () => {
    const result = settleMatchPoints(
      { position: "MID" },
      [
        { ...zeroMatchFacts, minutes: 90, goalsConcededByClub: 1 },
        { ...zeroMatchFacts, minutes: 90, goalsConcededByClub: 1 },
      ],
    );

    expect(result.total).toBe(1);
  });

  it("gives 5 for a goal, any position", () => {
    const result = settleMatchPoints(
      { position: "FWD" },
      [{ ...zeroMatchFacts, minutes: 90, goals: 1, goalsConcededByClub: 2 }],
    );

    expect(result.total).toBe(6);
  });

  it("gives 3 for an assist, any position", () => {
    const result = settleMatchPoints(
      { position: "MID" },
      [{ ...zeroMatchFacts, minutes: 90, assists: 1, goalsConcededByClub: 2 }],
    );

    expect(result.total).toBe(4);
  });

  it("gives -1 for a yellow, any position", () => {
    const result = settleMatchPoints(
      { position: "DEF" },
      [{ ...zeroMatchFacts, minutes: 90, yellows: 1, goalsConcededByClub: 2 }],
    );

    expect(result.total).toBe(0);
  });

  it("gives -3 for a red, any position", () => {
    const result = settleMatchPoints(
      { position: "GK" },
      [{ ...zeroMatchFacts, minutes: 90, reds: 1, goalsConcededByClub: 2 }],
    );

    expect(result.total).toBe(-2);
  });

  it("gives 4 clean sheet to a GK with at least 60 minutes and no goal conceded", () => {
    const result = settleMatchPoints(
      { position: "GK" },
      [{ ...zeroMatchFacts, minutes: 60 }],
    );

    expect(result.total).toBe(5);
  });

  it("gives 4 clean sheet to a DEF with at least 60 minutes and no goal conceded", () => {
    const result = settleMatchPoints(
      { position: "DEF" },
      [{ ...zeroMatchFacts, minutes: 60 }],
    );

    expect(result.total).toBe(5);
  });

  it("does not give a clean sheet to a MID", () => {
    const result = settleMatchPoints(
      { position: "MID" },
      [{ ...zeroMatchFacts, minutes: 90 }],
    );

    expect(result.total).toBe(1);
  });

  it("does not give a clean sheet under 60 minutes", () => {
    const result = settleMatchPoints(
      { position: "GK" },
      [{ ...zeroMatchFacts, minutes: 59 }],
    );

    expect(result.total).toBe(1);
  });

  it("does not deduct for an own goal and still breaks that match clean sheet", () => {
    const result = settleMatchPoints(
      { position: "DEF" },
      [{ ...zeroMatchFacts, minutes: 90, ownGoals: 1, goalsConcededByClub: 1 }],
    );

    expect(result.total).toBe(1);
  });

  it("breaks a clean sheet on an own goal even if club conceded was left at 0", () => {
    const result = settleMatchPoints(
      { position: "GK" },
      [{ ...zeroMatchFacts, minutes: 90, ownGoals: 1 }],
    );

    expect(result.total).toBe(1);
  });

  it("adds Match points from both Premier League matches in a Double", () => {
    const result = settleMatchPoints(
      { position: "DEF" },
      [
        { ...zeroMatchFacts, minutes: 90, goals: 1 },
        { ...zeroMatchFacts, minutes: 90, assists: 1, yellows: 1 },
      ],
    );

    expect(result.total).toBe(16);
  });
});