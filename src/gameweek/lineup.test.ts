import { describe, expect, it } from "vitest";
import type { Rarity, SkillWager } from "./catalogues.ts";
import type { PlayerCard } from "./generate-packs.ts";
import {
  addBench,
  addStarter,
  emptyDraft,
  isLegalLineup,
  lineupRole,
  moveBench,
  removeFromLineup,
  setCaptain,
  setSkill,
  toLockedLineup,
  validateLineup,
  type LineupDraft,
} from "./lineup.ts";
import type { SealedPool } from "./pool.ts";
import type { Position } from "./settle-match-points.ts";
import { settleLineup } from "./settle-lineup.ts";
import type { SkillMatchFacts } from "./settle-skill-wager.ts";

type Spec = readonly [name: string, club: string, position: Position, rarity: Rarity];

const BASE_SPECS: readonly Spec[] = [
  ["GK1", "A", "GK", "rare"],
  ["DEF1", "A", "DEF", "rare"],
  ["DEF2", "B", "DEF", "rare"],
  ["DEF3", "C", "DEF", "rare"],
  ["DEF4", "D", "DEF", "rare"],
  ["MID1", "B", "MID", "rare"],
  ["MID2", "C", "MID", "rare"],
  ["MID3", "D", "MID", "rare"],
  ["MID4", "E", "MID", "rare"],
  ["FWD1", "E", "FWD", "rare"],
  ["FWD2", "F", "FWD", "rare"],
  ["BENCH1", "A", "MID", "rare"],
  ["BENCH2", "B", "DEF", "rare"],
  ["BENCH3", "C", "MID", "rare"],
  ["BENCH4", "D", "DEF", "rare"],
];

const easyShots: SkillWager = {
  band: "Easy",
  kind: "vendor",
  stat: "shotsOnTarget",
  atLeast: 1,
};

const ultraShots: SkillWager = {
  band: "Ultra",
  kind: "vendor",
  stat: "shotsOnTarget",
  atLeast: 6,
};

function makePool(specs: readonly Spec[] = BASE_SPECS, skills: SkillWager[] = []): SealedPool {
  const basePack: PlayerCard[] = specs.map(([footballerName, club, position, rarity]) => ({
    footballerName,
    club,
    position,
    rarity,
  }));
  return { managerId: "m1", gameweekId: "2025-W38", basePack, skillPack: skills };
}

function validDraft(): LineupDraft {
  return {
    starters: [
      "GK1",
      "DEF1",
      "DEF2",
      "DEF3",
      "DEF4",
      "MID1",
      "MID2",
      "MID3",
      "MID4",
      "FWD1",
      "FWD2",
    ],
    bench: ["BENCH1", "BENCH2", "BENCH3", "BENCH4"],
    captain: "FWD1",
    skills: {},
  };
}

describe("validateLineup", () => {
  it("accepts a legal 11 + 4 with a Captain and a Naked slot", () => {
    const draft = validDraft();
    draft.skills = { FWD1: [easyShots, null], GK1: [null] };

    expect(validateLineup(draft, makePool(BASE_SPECS, [easyShots]))).toEqual([]);
    expect(isLegalLineup(draft, makePool(BASE_SPECS, [easyShots]))).toBe(true);
  });

  it("rejects the wrong number of starters or bench", () => {
    const shortStarters = validDraft();
    shortStarters.starters = shortStarters.starters.slice(0, 10);
    expect(validateLineup(shortStarters, makePool())).toContain("wrong-starter-count");

    const shortBench = validDraft();
    shortBench.bench = shortBench.bench.slice(0, 3);
    expect(validateLineup(shortBench, makePool())).toContain("wrong-bench-count");
  });

  it("rejects duplicates and unknown footballers", () => {
    const duplicated = validDraft();
    duplicated.starters = ["FWD1", ...duplicated.starters.slice(0, 10)];
    expect(validateLineup(duplicated, makePool())).toContain("duplicate-footballer");

    const unknown = validDraft();
    unknown.starters = ["GHOST", ...unknown.starters.slice(0, 10)];
    expect(validateLineup(unknown, makePool())).toContain("unknown-footballer");
  });

  it("requires a Captain who is a starter", () => {
    const missing = validDraft();
    missing.captain = null;
    expect(validateLineup(missing, makePool())).toContain("missing-captain");

    const onBench = validDraft();
    onBench.captain = "BENCH1";
    expect(validateLineup(onBench, makePool())).toContain("captain-not-starter");
  });

  it("rejects a formation that breaks the floor", () => {
    const draft = validDraft();
    draft.starters = [
      "GK1",
      "DEF1",
      "DEF2",
      "MID1",
      "MID2",
      "MID3",
      "MID4",
      "BENCH1",
      "FWD1",
      "FWD2",
      "BENCH3",
    ];

    expect(validateLineup(draft, makePool())).toContain("formation");
  });

  it("rejects more than 3 epic or 4 super rare starters", () => {
    const specs = BASE_SPECS.map((spec) =>
      ["DEF1", "DEF2", "DEF3", "DEF4"].includes(spec[0])
        ? ([spec[0], spec[1], spec[2], "epic"] as Spec)
        : spec,
    );

    expect(validateLineup(validDraft(), makePool(specs))).toContain("rarity-cap");
  });

  it("rejects a fourth footballer from the same Club", () => {
    const specs = BASE_SPECS.map((spec) =>
      spec[0] === "BENCH4" ? ([spec[0], "A", spec[2], spec[3]] as Spec) : spec,
    );

    expect(validateLineup(validDraft(), makePool(specs))).toContain("club-cap");
  });

  it("rejects a second Skill on a non-Captain", () => {
    const draft = validDraft();
    draft.skills = { GK1: [easyShots, easyShots] };

    expect(validateLineup(draft, makePool(BASE_SPECS, [easyShots, easyShots]))).toContain(
      "too-many-skills",
    );
  });

  it("rejects Skills on the bench", () => {
    const draft = validDraft();
    draft.skills = { BENCH1: [easyShots] };

    expect(validateLineup(draft, makePool(BASE_SPECS, [easyShots]))).toContain(
      "skill-on-bench",
    );
  });

  it("rejects a Skill that is not in the pack, and allows a worn duplicate", () => {
    const notInPack = validDraft();
    notInPack.skills = { GK1: [ultraShots] };
    expect(validateLineup(notInPack, makePool(BASE_SPECS, [easyShots]))).toContain(
      "skill-not-in-pool",
    );

    const duplicate = validDraft();
    duplicate.skills = { GK1: [easyShots], MID1: [easyShots] };
    expect(validateLineup(duplicate, makePool(BASE_SPECS, [easyShots, easyShots]))).toEqual(
      [],
    );
  });
});

describe("draft editing", () => {
  it("moves a footballer between bench and starters", () => {
    const open = validDraft();
    open.starters = open.starters.slice(0, 10);
    const draft = addStarter(open, "BENCH1");

    expect(draft.bench).not.toContain("BENCH1");
    expect(draft.starters).toContain("BENCH1");
    expect(draft.starters).toHaveLength(11);
    expect(lineupRole(draft, "BENCH1")).toBe("starter");

    const benched = addBench(draft, "BENCH1");
    expect(benched.starters).not.toContain("BENCH1");
    expect(benched.bench).toContain("BENCH1");
  });

  it("does not overflow the starter or bench slots", () => {
    const full = addStarter(validDraft(), "BENCH1");
    expect(full.starters).toHaveLength(11);

    const fullBench = addBench(validDraft(), "MID4");
    expect(fullBench.bench).toHaveLength(4);
  });

  it("clears Captain and Skills when a footballer moves to the bench", () => {
    const draft = validDraft();
    draft.skills = { FWD1: [easyShots, null] };
    draft.bench = draft.bench.slice(0, 3);
    const removed = addBench(draft, "FWD1");

    expect(removed.captain).toBeNull();
    expect(removed.skills.FWD1).toBeUndefined();
  });

  it("removes a footballer from the Lineup entirely", () => {
    const draft = removeFromLineup(validDraft(), "FWD1");

    expect(draft.starters).not.toContain("FWD1");
    expect(draft.captain).toBeNull();
  });

  it("only lets a starter be Captain", () => {
    const draft = setCaptain(validDraft(), "BENCH1");
    expect(draft.captain).toBe("FWD1");

    expect(setCaptain(draft, "GK1").captain).toBe("GK1");
  });

  it("reorders the bench", () => {
    const draft = moveBench(validDraft(), "BENCH1", 2);

    expect(draft.bench).toEqual(["BENCH2", "BENCH3", "BENCH1", "BENCH4"]);
  });

  it("gives the Captain two Skill slots and a starter one", () => {
    let draft = validDraft();
    draft = setSkill(draft, "FWD1", 0, easyShots);
    draft = setSkill(draft, "FWD1", 1, ultraShots);
    expect(draft.skills.FWD1).toEqual([easyShots, ultraShots]);

    draft = setSkill(draft, "GK1", 0, easyShots);
    draft = setSkill(draft, "GK1", 1, ultraShots);
    expect(draft.skills.GK1).toEqual([easyShots]);
  });

  it("starts empty", () => {
    const draft = emptyDraft();
    expect(draft).toEqual({ starters: [], bench: [], captain: null, skills: {} });
  });
});

describe("toLockedLineup", () => {
  it("maps the draft onto the settlement seam", () => {
    const draft = validDraft();
    draft.skills = { FWD1: [easyShots, null] };
    const locked = toLockedLineup(draft, makePool(BASE_SPECS, [easyShots]));

    expect(locked.starters).toHaveLength(11);
    expect(locked.bench).toHaveLength(4);
    expect(locked.captainIndex).toBe(draft.starters.indexOf("FWD1"));
    const captain = locked.starters[locked.captainIndex]!;
    expect(captain.footballer.footballerName).toBe("FWD1");
    expect(captain.skills).toEqual([easyShots, null]);
    expect(locked.starters[0]!.skills).toEqual([null]);
  });

  it("does not double the Captain's Match points", () => {
    const draft = validDraft();
    draft.skills = { FWD1: [easyShots, ultraShots] };
    const locked = toLockedLineup(draft, makePool(BASE_SPECS, [easyShots, ultraShots]));

    const zero: SkillMatchFacts = {
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
    };
    const facts = new Map([
      ["FWD1", [{ ...zero, minutes: 90, goals: 1, shotsOnTarget: 6 }]],
    ]);
    const result = settleLineup(locked, facts);
    const captain = result.slots[locked.captainIndex]!;

    expect(captain.matchPoints).toBe(6); // appearance + goal, not doubled
    expect(captain.skillPoints).toBe(10); // Easy +2, Ultra +8
  });
});
