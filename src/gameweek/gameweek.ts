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

export function parseGameweekId(gameweekId: GameweekId): { year: number; week: number } {
  const match = /^(\d{4})-W(\d{2})$/.exec(gameweekId);
  if (!match) {
    throw new Error(`unknown Gameweek id: ${gameweekId}`);
  }
  return { year: Number(match[1]), week: Number(match[2]) };
}

export function mondayOfIsoWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return monday;
}

/** The Gameweek after the given one, e.g. `2025-W38` -> `2025-W39`. */
export function nextGameweekId(gameweekId: GameweekId): GameweekId {
  const { year, week } = parseGameweekId(gameweekId);
  const monday = mondayOfIsoWeek(year, week);
  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);
  return isoWeekId(nextMonday);
}
