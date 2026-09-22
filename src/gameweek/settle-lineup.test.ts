import { describe, expect, it } from "vitest";
import type { SkillWager } from "./catalogues.ts";
import type { PlayerCard } from "./generate-packs.ts";
import { settleLineup, type LockedLineup } from "./settle-lineup.ts";
import type { SkillMatchFacts } from "./settle-skill-wager.ts";

const zeroMatch: SkillMatchFacts = {
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

function card(
  name: string,
  club: string,
  position: "GK" | "DEF" | "MID" | "FWD",
  rarity: "epic" | "superRare" | "rare" = "rare",
): PlayerCard {
  return { footballerName: name, club, position, rarity };
}

const easyShotsOnTarget: SkillWager = {
  band: "Easy",
  kind: "vendor",
  stat: "shotsOnTarget",
  atLeast: 1,
};

function lineup(starters: LockedLineup["starters"], bench: PlayerCard[]): LockedLineup {
  return { starters, bench, captainIndex: 0 };
}

function slot(footballer: PlayerCard, ...skills: (SkillWager | null)[]) {
  return { footballer, skills };
}

function facts(
  lineup: LockedLineup,
  overrides: Record<string, Partial<SkillMatchFacts>> = {},
  defaults: Partial<SkillMatchFacts> = {},
): Map<string, readonly SkillMatchFacts[]> {
  const names = [
    ...lineup.starters.map((s) => s.footballer.footballerName),
    ...lineup.bench.map((b) => b.footballerName),
  ];
  const map = new Map<string, readonly SkillMatchFacts[]>();
  for (const name of names) {
    map.set(name, [{ ...zeroMatch, ...defaults, ...(overrides[name] ?? {}) }]);
  }
  return map;
}

describe("settleLineup", () => {
  it("triggers Auto-sub for a Blank starter and walks the ordered bench", () => {
    const blankStarter = card("Blank MID", "Arsenal", "MID");
    const benchMid = card("Bench MID", "Chelsea", "MID");
    const benchFwd = card("Bench FWD", "Liverpool", "FWD");

    const locked = lineup(
      [
        slot(blankStarter, easyShotsOnTarget),
        slot(card("GK", "City", "GK")),
        slot(card("DEF1", "City", "DEF")),
        slot(card("DEF2", "United", "DEF")),
        slot(card("DEF3", "United", "DEF")),
        slot(card("MID2", "Arsenal", "MID")),
        slot(card("MID3", "Chelsea", "MID")),
        slot(card("FWD1", "Liverpool", "FWD")),
        slot(card("FWD2", "Spurs", "FWD")),
        slot(card("FWD3", "Newcastle", "FWD")),
        slot(card("MID4", "Villa", "MID")),
      ],
      [benchMid, benchFwd],
    );

    const result = settleLineup(
      locked,
      facts(locked, {
        [blankStarter.footballerName]: zeroMatch,
        [benchMid.footballerName]: { minutes: 90, goals: 1 },
        [benchFwd.footballerName]: { minutes: 90, goals: 1 },
      }),
    );

    expect(result.slots[0]!.autoSub).toEqual(benchMid);
    expect(result.slots[0]!.matchPoints).toBe(6); // appearance 1 + goal 5
    expect(result.benchUsed[0]).toBe(true);
  });

  it("makes the Auto-sub Naked so the bench player scores Match points only", () => {
    const blankStarter = card("Blank FWD", "Arsenal", "FWD");
    const benchFwd = card("Bench FWD", "Chelsea", "FWD");

    const locked = lineup(
      [
        slot(blankStarter, easyShotsOnTarget),
        slot(card("GK", "City", "GK")),
        slot(card("DEF1", "City", "DEF")),
        slot(card("DEF2", "United", "DEF")),
        slot(card("DEF3", "United", "DEF")),
        slot(card("MID1", "Arsenal", "MID")),
        slot(card("MID2", "Chelsea", "MID")),
        slot(card("MID3", "Liverpool", "MID")),
        slot(card("FWD2", "Spurs", "FWD")),
        slot(card("FWD3", "Newcastle", "FWD")),
        slot(card("MID4", "Villa", "MID")),
      ],
      [benchFwd],
    );

    const result = settleLineup(
      locked,
      facts(locked, {
        [blankStarter.footballerName]: zeroMatch,
        [benchFwd.footballerName]: { minutes: 90, shotsOnTarget: 5 },
      }),
    );

    expect(result.slots[0]!.autoSub).toEqual(benchFwd);
    expect(result.slots[0]!.matchPoints).toBe(1); // appearance only
    expect(result.slots[0]!.skillPoints).toBe(-1); // starter's skill misses
  });

  it("keeps the worn Skill on the Blank starter and makes it miss", () => {
    const blankStarter = card("Blank DEF", "Arsenal", "DEF");
    const benchDef = card("Bench DEF", "Chelsea", "DEF");

    const locked = lineup(
      [
        slot(blankStarter, easyShotsOnTarget),
        slot(card("GK", "City", "GK")),
        slot(card("DEF2", "City", "DEF")),
        slot(card("DEF3", "United", "DEF")),
        slot(card("MID1", "Arsenal", "MID")),
        slot(card("MID2", "Chelsea", "MID")),
        slot(card("MID3", "Liverpool", "MID")),
        slot(card("FWD1", "Liverpool", "FWD")),
        slot(card("FWD2", "Spurs", "FWD")),
        slot(card("FWD3", "Newcastle", "FWD")),
        slot(card("MID4", "Villa", "MID")),
      ],
      [benchDef],
    );

    const result = settleLineup(
      locked,
      facts(locked, {
        [blankStarter.footballerName]: zeroMatch,
        [benchDef.footballerName]: { minutes: 90, shotsOnTarget: 1 },
      }),
    );

    expect(result.slots[0]!.starter).toEqual(blankStarter);
    expect(result.slots[0]!.skills[0]!.wager).toEqual(easyShotsOnTarget);
    expect(result.slots[0]!.skills[0]!.points).toBe(-1);
    expect(result.slots[0]!.matchPointsSource).toEqual(benchDef);
  });

  it("does not Auto-sub when the starter plays at least one minute", () => {
    const appearingStarter = card("Appearing FWD", "Arsenal", "FWD");
    const benchFwd = card("Bench FWD", "Chelsea", "FWD");

    const locked = lineup(
      [
        slot(appearingStarter),
        slot(card("GK", "City", "GK")),
        slot(card("DEF1", "City", "DEF")),
        slot(card("DEF2", "United", "DEF")),
        slot(card("DEF3", "United", "DEF")),
        slot(card("MID1", "Arsenal", "MID")),
        slot(card("MID2", "Chelsea", "MID")),
        slot(card("MID3", "Liverpool", "MID")),
        slot(card("FWD2", "Spurs", "FWD")),
        slot(card("FWD3", "Newcastle", "FWD")),
        slot(card("MID4", "Villa", "MID")),
      ],
      [benchFwd],
    );

    const result = settleLineup(
      locked,
      facts(
        locked,
        {
          [appearingStarter.footballerName]: { minutes: 1 },
          [benchFwd.footballerName]: { minutes: 90, goals: 1 },
        },
        { minutes: 90 },
      ),
    );

    expect(result.slots[0]!.autoSub).toBeNull();
    expect(result.slots[0]!.matchPoints).toBe(1);
    expect(result.benchUsed[0]).toBe(false);
  });

  it("leaves the slot empty when no legal replacement exists", () => {
    const blankStarter = card("Blank FWD", "Arsenal", "FWD");
    const benchGk = card("Bench GK", "Chelsea", "GK");

    const locked = lineup(
      [
        slot(blankStarter, easyShotsOnTarget),
        slot(card("GK", "City", "GK")),
        slot(card("DEF1", "City", "DEF")),
        slot(card("DEF2", "United", "DEF")),
        slot(card("DEF3", "United", "DEF")),
        slot(card("MID1", "Arsenal", "MID")),
        slot(card("MID2", "Chelsea", "MID")),
        slot(card("MID3", "Liverpool", "MID")),
        slot(card("FWD2", "Spurs", "FWD")),
        slot(card("FWD3", "Newcastle", "FWD")),
        slot(card("MID4", "Villa", "MID")),
      ],
      [benchGk],
    );

    const result = settleLineup(
      locked,
      facts(locked, {
        [blankStarter.footballerName]: zeroMatch,
        [benchGk.footballerName]: { minutes: 90 },
      }),
    );

    expect(result.slots[0]!.autoSub).toBeNull();
    expect(result.slots[0]!.matchPoints).toBe(0);
    expect(result.slots[0]!.skillPoints).toBe(-1);
    expect(result.slots[0]!.total).toBe(-1);
  });

  it("respects formation rules when choosing an Auto-sub", () => {
    const blankGk = card("Blank GK", "Arsenal", "GK");
    const benchFwd = card("Bench FWD", "Chelsea", "FWD");
    const benchGk = card("Bench GK", "Liverpool", "GK");

    const locked = lineup(
      [
        slot(blankGk),
        slot(card("DEF1", "City", "DEF")),
        slot(card("DEF2", "United", "DEF")),
        slot(card("DEF3", "United", "DEF")),
        slot(card("MID1", "Arsenal", "MID")),
        slot(card("MID2", "Chelsea", "MID")),
        slot(card("MID3", "Liverpool", "MID")),
        slot(card("FWD1", "Liverpool", "FWD")),
        slot(card("FWD2", "Spurs", "FWD")),
        slot(card("FWD3", "Newcastle", "FWD")),
        slot(card("MID4", "Villa", "MID")),
      ],
      [benchFwd, benchGk],
    );

    const result = settleLineup(
      locked,
      facts(
        locked,
        {
          [blankGk.footballerName]: zeroMatch,
          [benchFwd.footballerName]: { minutes: 90, goals: 1 },
          [benchGk.footballerName]: { minutes: 90 },
        },
        { minutes: 90 },
      ),
    );

    expect(result.slots[0]!.autoSub).toEqual(benchGk);
    expect(result.benchUsed).toEqual([false, true]);
  });

  it("respects the rarity cap when choosing an Auto-sub", () => {
    const blankDef = card("Blank DEF", "Arsenal", "DEF", "rare");
    const benchDefRare = card("Bench DEF Rare", "Chelsea", "DEF", "rare");
    const benchDefEpic = card("Bench DEF Epic", "Liverpool", "DEF", "epic");

    const locked = lineup(
      [
        slot(blankDef),
        slot(card("GK", "City", "GK", "rare")),
        slot(card("DEF2", "United", "DEF", "epic")),
        slot(card("DEF3", "United", "DEF", "epic")),
        slot(card("DEF4", "Spurs", "DEF", "epic")),
        slot(card("MID1", "Arsenal", "MID", "rare")),
        slot(card("MID2", "Chelsea", "MID", "rare")),
        slot(card("MID3", "Liverpool", "MID", "rare")),
        slot(card("FWD1", "Liverpool", "FWD", "rare")),
        slot(card("FWD2", "Spurs", "FWD", "rare")),
        slot(card("FWD3", "Newcastle", "FWD", "rare")),
      ],
      [benchDefEpic, benchDefRare],
    );

    const result = settleLineup(
      locked,
      facts(locked, {
        [blankDef.footballerName]: zeroMatch,
        [benchDefRare.footballerName]: { minutes: 90 },
        [benchDefEpic.footballerName]: { minutes: 90 },
      }),
    );

    // First bench player is epic; replacing the rare blank would make 4 epics.
    expect(result.slots[0]!.autoSub).toEqual(benchDefRare);
  });

  it("settles the Captain's two independent Skill wagers", () => {
    const captain = card("Captain MID", "Arsenal", "MID");
    const hardShotsOnTarget: SkillWager = {
      band: "Hard",
      kind: "vendor",
      stat: "shotsOnTarget",
      atLeast: 4,
    };

    const locked = lineup(
      [
        slot(captain, easyShotsOnTarget, hardShotsOnTarget),
        slot(card("GK", "City", "GK")),
        slot(card("DEF1", "United", "DEF")),
        slot(card("DEF2", "United", "DEF")),
        slot(card("DEF3", "Spurs", "DEF")),
        slot(card("MID2", "Chelsea", "MID")),
        slot(card("MID3", "Liverpool", "MID")),
        slot(card("FWD1", "Liverpool", "FWD")),
        slot(card("FWD2", "Spurs", "FWD")),
        slot(card("FWD3", "Newcastle", "FWD")),
        slot(card("MID4", "Villa", "MID")),
      ],
      [],
    );

    const result = settleLineup(
      locked,
      facts(locked, {
        [captain.footballerName]: { minutes: 90, shotsOnTarget: 4 },
      }),
    );

    expect(result.slots[0]!.skills).toHaveLength(2);
    expect(result.slots[0]!.skills[0]!.points).toBe(2); // Easy hit
    expect(result.slots[0]!.skills[1]!.points).toBe(4); // Hard hit
    expect(result.slots[0]!.skillPoints).toBe(6);
  });
});
