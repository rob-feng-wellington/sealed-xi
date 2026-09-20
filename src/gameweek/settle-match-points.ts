import { MATCH_POINTS } from "./catalogues.ts";

export type Position = "GK" | "DEF" | "MID" | "FWD";

export type MatchFacts = {
  minutes: number;
  goals: number;
  assists: number;
  yellows: number;
  reds: number;
  goalsConcededByClub: number;
  ownGoals: number;
};

export type Footballer = {
  position: Position;
};

export type MatchPoints = {
  total: number;
};

export function settleMatchPoints(
  footballer: Footballer,
  matches: readonly MatchFacts[],
): MatchPoints {
  const appeared = matches.some((match) => match.minutes >= 1);
  let total = appeared ? MATCH_POINTS.appearance : 0;
  for (const match of matches) {
    total += match.goals * MATCH_POINTS.goal;
    total += match.assists * MATCH_POINTS.assist;
    total += match.yellows * MATCH_POINTS.yellow;
    total += match.reds * MATCH_POINTS.red;
    if (earnsCleanSheet(footballer.position, match)) {
      total += MATCH_POINTS.cleanSheet;
    }
  }
  return { total };
}

function earnsCleanSheet(position: Position, match: MatchFacts): boolean {
  if (position !== "GK" && position !== "DEF") {
    return false;
  }
  return (
    match.minutes >= 60 &&
    match.goalsConcededByClub === 0 &&
    match.ownGoals === 0
  );
}