import { SKILL_WAGER_PAYOUTS, type SkillWager } from "./catalogues.ts";
import { earnsCleanSheet, type Footballer, type MatchFacts } from "./settle-match-points.ts";

export type VendorMatchStats = {
  shotsOnTarget: number;
  keyPasses: number;
  tackles: number;
  interceptions: number;
  successfulDribbles: number;
  saves: number;
};

export type SkillMatchFacts = MatchFacts & VendorMatchStats;

export type SkillWagerResult = {
  points: number;
};

export function settleSkillWager(
  footballer: Footballer,
  wager: SkillWager | null,
  matches: readonly SkillMatchFacts[],
): SkillWagerResult {
  if (wager === null) {
    return { points: 0 };
  }

  const payout = SKILL_WAGER_PAYOUTS[wager.band];
  const blank = !matches.some((match) => match.minutes >= 1);
  if (blank) {
    return { points: payout.miss };
  }

  if (wager.kind === "vendor" && wager.stat === "saves" && footballer.position !== "GK") {
    return { points: payout.miss };
  }

  const hit = matches.some((match) => wagerHits(wager, footballer, match));
  return { points: hit ? payout.hit : payout.miss };
}

function wagerHits(
  wager: SkillWager,
  footballer: Footballer,
  match: SkillMatchFacts,
): boolean {
  switch (wager.kind) {
    case "vendor":
      return match[wager.stat] >= wager.atLeast;
    case "public":
      return earnsCleanSheet(footballer.position, match);
    case "derived":
      if (wager.event === "brace") {
        return match.goals >= 2;
      }
      if (wager.event === "goalAndAssist") {
        return match.goals >= 1 && match.assists >= 1;
      }
      return match.goals >= 3;
  }
}
