import { describe, expect, it } from "vitest";
import type { SkillWager } from "./catalogues.ts";
import { settleSkillWager } from "./settle-skill-wager.ts";

const zeroMatch = {
  minutes: 0,
  goals: 0,
  assists: 0,
  yellows: 0,
  reds: 0,
  goalsConcededByClub: 0,
  ownGoals: 0,
  shotsOnTarget: 0,
  keyPasses: 0,
  tackles: 0,
  interceptions: 0,
  successfulDribbles: 0,
  saves: 0,
} as const;

const easyShotsOnTarget: SkillWager = {
  band: "Easy",
  kind: "vendor",
  stat: "shotsOnTarget",
  atLeast: 1,
};

const hardShotsOnTarget: SkillWager = {
  band: "Hard",
  kind: "vendor",
  stat: "shotsOnTarget",
  atLeast: 4,
};

const ultraHatTrick: SkillWager = {
  band: "Ultra",
  kind: "derived",
  event: "hatTrick",
};

describe("settleSkillWager", () => {
  it("scores nothing for Naked: no hit and no miss", () => {
    const result = settleSkillWager(
      { position: "FWD" },
      null,
      [{ ...zeroMatch, minutes: 90, shotsOnTarget: 5 }],
    );

    expect(result.points).toBe(0);
  });

  it("pays +2 on an Easy hit and -1 on a miss", () => {
    const hit = settleSkillWager(
      { position: "FWD" },
      easyShotsOnTarget,
      [{ ...zeroMatch, minutes: 90, shotsOnTarget: 1 }],
    );
    const miss = settleSkillWager(
      { position: "FWD" },
      easyShotsOnTarget,
      [{ ...zeroMatch, minutes: 90 }],
    );

    expect(hit.points).toBe(2);
    expect(miss.points).toBe(-1);
  });

  it("pays +4 on a Hard hit and -1 on a miss", () => {
    const goalAndAssist: SkillWager = {
      band: "Hard",
      kind: "derived",
      event: "goalAndAssist",
    };

    const hit = settleSkillWager(
      { position: "MID" },
      goalAndAssist,
      [{ ...zeroMatch, minutes: 90, goals: 1, assists: 1 }],
    );
    const miss = settleSkillWager(
      { position: "MID" },
      goalAndAssist,
      [{ ...zeroMatch, minutes: 90, goals: 1 }],
    );

    expect(hit.points).toBe(4);
    expect(miss.points).toBe(-1);
  });

  it("pays +8 on an Ultra hit and -1 on a miss", () => {
    const hit = settleSkillWager(
      { position: "FWD" },
      ultraHatTrick,
      [{ ...zeroMatch, minutes: 90, goals: 3 }],
    );
    const miss = settleSkillWager(
      { position: "FWD" },
      ultraHatTrick,
      [{ ...zeroMatch, minutes: 90, goals: 2 }],
    );

    expect(hit.points).toBe(8);
    expect(miss.points).toBe(-1);
  });

  it("misses a worn Skill on a Blank starter", () => {
    const result = settleSkillWager({ position: "FWD" }, easyShotsOnTarget, [
      { ...zeroMatch },
    ]);

    expect(result.points).toBe(-1);
  });

  it("misses a save Skill on a non-goalkeeper", () => {
    const saveSkill: SkillWager = {
      band: "Easy",
      kind: "vendor",
      stat: "saves",
      atLeast: 3,
    };

    const result = settleSkillWager(
      { position: "DEF" },
      saveSkill,
      [{ ...zeroMatch, minutes: 90, saves: 10 }],
    );

    expect(result.points).toBe(-1);
  });

  it("does not sum vendor thresholds across a Double", () => {
    const result = settleSkillWager(
      { position: "FWD" },
      hardShotsOnTarget,
      [
        { ...zeroMatch, minutes: 90, shotsOnTarget: 2 },
        { ...zeroMatch, minutes: 90, shotsOnTarget: 2 },
      ],
    );

    expect(result.points).toBe(-1);
  });

  it("does not sum derived thresholds across a Double", () => {
    const brace: SkillWager = { band: "Hard", kind: "derived", event: "brace" };

    const result = settleSkillWager(
      { position: "FWD" },
      brace,
      [
        { ...zeroMatch, minutes: 90, goals: 1 },
        { ...zeroMatch, minutes: 90, goals: 1 },
      ],
    );

    expect(result.points).toBe(-1);
  });

  it("hits an Easy clean sheet Skill with the same 60-minute GK/DEF rule", () => {
    const cleanSheet: SkillWager = {
      band: "Easy",
      kind: "public",
      event: "cleanSheet",
    };

    const hit = settleSkillWager(
      { position: "DEF" },
      cleanSheet,
      [{ ...zeroMatch, minutes: 60 }],
    );
    const miss = settleSkillWager(
      { position: "DEF" },
      cleanSheet,
      [{ ...zeroMatch, minutes: 59 }],
    );

    expect(hit.points).toBe(2);
    expect(miss.points).toBe(-1);
  });
});
