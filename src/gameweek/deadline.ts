import { mondayOfIsoWeek, parseGameweekId, type GameweekId } from "./gameweek.ts";

export const DEADLINE_LEAD_MINUTES = 90;

/**
 * Lineup lock is 90 minutes before this Gameweek's first Premier League
 * kickoff, not a fixed China-time clock.
 */
export function deadlineFromFirstKickoff(firstKickoff: Date): Date {
  return new Date(firstKickoff.getTime() - DEADLINE_LEAD_MINUTES * 60 * 1000);
}

export function isPastDeadline(now: Date, deadline: Date): boolean {
  return now.getTime() >= deadline.getTime();
}

/**
 * Placeholder fixture feed: the Gameweek's first kickoff is the Saturday of its
 * ISO week at 12:30 UTC. The real feed lands with ingest; the Deadline rule
 * above is what the domain depends on.
 */
export function scheduledFirstKickoff(gameweekId: GameweekId): Date {
  const { year, week } = parseGameweekId(gameweekId);
  const monday = mondayOfIsoWeek(year, week);
  const firstKickoff = new Date(monday);
  firstKickoff.setUTCDate(monday.getUTCDate() + 5);
  firstKickoff.setUTCHours(12, 30, 0, 0);
  return firstKickoff;
}

export function deadlineForGameweek(gameweekId: GameweekId): Date {
  return deadlineFromFirstKickoff(scheduledFirstKickoff(gameweekId));
}
