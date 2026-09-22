import { RARITY_CAPS, type SkillWager } from "./catalogues.ts";
import type { PlayerCard } from "./generate-packs.ts";
import { settleMatchPoints } from "./settle-match-points.ts";
import { settleSkillWager, type SkillMatchFacts } from "./settle-skill-wager.ts";

export type FootballerMatchFacts = SkillMatchFacts;

export type StarterSlot = {
  footballer: PlayerCard;
  skills: readonly (SkillWager | null)[];
};

export type LockedLineup = {
  starters: readonly StarterSlot[];
  bench: readonly PlayerCard[];
  captainIndex: number;
};

export type SettledSkill = {
  wager: SkillWager | null;
  points: number;
};

export type SettledSlot = {
  starter: PlayerCard;
  skills: readonly SettledSkill[];
  skillPoints: number;
  matchPointsSource: PlayerCard;
  autoSub: PlayerCard | null;
  matchPoints: number;
  total: number;
};

export type LineupSettlement = {
  slots: readonly SettledSlot[];
  benchUsed: readonly boolean[];
  totalMatchPoints: number;
  totalSkillPoints: number;
  total: number;
};

export function settleLineup(
  lineup: LockedLineup,
  factsByFootballer: ReadonlyMap<string, readonly FootballerMatchFacts[]>,
): LineupSettlement {
  const benchUsed = new Array(lineup.bench.length).fill(false);
  const slots: SettledSlot[] = [];

  // Track the effective starting eleven as auto-subs are applied, so later
  // legality checks see the current on-pitch shape.
  const effectiveStarters = lineup.starters.map((slot) => slot.footballer);

  for (let i = 0; i < lineup.starters.length; i++) {
    const slot = lineup.starters[i]!;
    const starterMatches = factsByFootballer.get(slot.footballer.footballerName) ?? [];
    const blank = !starterMatches.some((match) => match.minutes >= 1);

    let matchPointsSource = slot.footballer;
    let autoSub: PlayerCard | null = null;

    if (blank) {
      const replacement = findAutoSub(
        lineup.bench,
        benchUsed,
        effectiveStarters,
        i,
      );
      if (replacement !== null) {
        autoSub = replacement.player;
        benchUsed[replacement.benchIndex] = true;
        matchPointsSource = autoSub;
        effectiveStarters[i] = autoSub;
      }
    }

    const matchPointsFacts =
      factsByFootballer.get(matchPointsSource.footballerName) ?? [];
    const matchPoints = settleMatchPoints(matchPointsSource, matchPointsFacts).total;

    const skills: SettledSkill[] = slot.skills.map((wager) => ({
      wager,
      points: settleSkillWager(slot.footballer, wager, starterMatches).points,
    }));
    const skillPoints = skills.reduce((sum, skill) => sum + skill.points, 0);

    slots.push({
      starter: slot.footballer,
      skills,
      skillPoints,
      matchPointsSource,
      autoSub,
      matchPoints,
      total: matchPoints + skillPoints,
    });
  }

  const totalMatchPoints = slots.reduce((sum, s) => sum + s.matchPoints, 0);
  const totalSkillPoints = slots.reduce((sum, s) => sum + s.skillPoints, 0);

  return {
    slots,
    benchUsed,
    totalMatchPoints,
    totalSkillPoints,
    total: totalMatchPoints + totalSkillPoints,
  };
}

function findAutoSub(
  bench: readonly PlayerCard[],
  benchUsed: readonly boolean[],
  effectiveStarters: readonly PlayerCard[],
  blankStarterIndex: number,
): { player: PlayerCard; benchIndex: number } | null {
  for (let b = 0; b < bench.length; b++) {
    if (benchUsed[b]) {
      continue;
    }
    const candidate = bench[b]!;
    const hypotheticalStarters = effectiveStarters.map((starter, index) =>
      index === blankStarterIndex ? candidate : starter,
    );
    if (isLegalStartingEleven(hypotheticalStarters)) {
      return { player: candidate, benchIndex: b };
    }
  }
  return null;
}

function isLegalStartingEleven(starters: readonly PlayerCard[]): boolean {
  const gk = starters.filter((card) => card.position === "GK").length;
  const def = starters.filter((card) => card.position === "DEF").length;
  const mid = starters.filter((card) => card.position === "MID").length;
  const fwd = starters.filter((card) => card.position === "FWD").length;

  if (gk !== 1) {
    return false;
  }
  if (def < 3 || mid < 2 || fwd < 1) {
    return false;
  }

  const epic = starters.filter((card) => card.rarity === "epic").length;
  const superRare = starters.filter((card) => card.rarity === "superRare").length;

  return epic <= RARITY_CAPS.epic && superRare <= RARITY_CAPS.superRare;
}
