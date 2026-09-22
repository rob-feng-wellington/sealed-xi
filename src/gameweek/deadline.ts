import type { GameweekId } from "./gameweek.ts";

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

function mondayOfIsoWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return monday;
}

/**
 * Placeholder fixture feed: the Gameweek's first kickoff is the Saturday of its
 * ISO week at 12:30 UTC. The real feed lands with ingest; the Deadline rule
 * above is what the domain depends on.
 */
export function scheduledFirstKickoff(gameweekId: GameweekId): Date {
  const match = /^(\d{4})-W(\d{2})$/.exec(gameweekId);
  if (!match) {
    throw new Error(`unknown Gameweek id: ${gameweekId}`);
  }
  const monday = mondayOfIsoWeek(Number(match[1]), Number(match[2]));
  const firstKickoff = new Date(monday);
  firstKickoff.setUTCDate(monday.getUTCDate() + 5);
  firstKickoff.setUTCHours(12, 30, 0, 0);
  return firstKickoff;
}

export function deadlineForGameweek(gameweekId: GameweekId): Date {
  return deadlineFromFirstKickoff(scheduledFirstKickoff(gameweekId));
}
