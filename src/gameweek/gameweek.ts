export type GameweekId = string;

/**
 * ISO-8601 week identifier, e.g. `2025-W38`. One Premier League round maps to
 * one of these; Playing rights are scoped to it.
 */
export function isoWeekId(date: Date): GameweekId {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function currentGameweekId(now: Date = new Date()): GameweekId {
  return isoWeekId(now);
}
