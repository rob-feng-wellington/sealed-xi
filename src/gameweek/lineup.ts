import { RARITY_CAPS, type SkillWager } from "./catalogues.ts";
import type { PlayerCard } from "./generate-packs.ts";
import type { SealedPool } from "./pool.ts";
import type { LockedLineup } from "./settle-lineup.ts";

export const STARTER_COUNT = 11;
export const BENCH_COUNT = 4;
export const CLUB_CAP = 3;
export const FORMATION = { GK: 1, DEF: 3, MID: 2, FWD: 1 } as const;

export type LineupDraft = {
  starters: readonly string[];
  bench: readonly string[];
  captain: string | null;
  skills: Readonly<Record<string, readonly (SkillWager | null)[]>>;
};

export type LineupIssue =
  | "wrong-starter-count"
  | "wrong-bench-count"
  | "duplicate-footballer"
  | "unknown-footballer"
  | "missing-captain"
  | "captain-not-starter"
  | "formation"
  | "rarity-cap"
  | "club-cap"
  | "too-many-skills"
  | "skill-on-bench"
  | "skill-not-in-pool";

export type LineupRole = "pool" | "starter" | "bench";

export function emptyDraft(): LineupDraft {
  return { starters: [], bench: [], captain: null, skills: {} };
}

export function lineupRole(draft: LineupDraft, name: string): LineupRole {
  if (draft.starters.includes(name)) return "starter";
  if (draft.bench.includes(name)) return "bench";
  return "pool";
}

export function addStarter(draft: LineupDraft, name: string): LineupDraft {
  if (draft.starters.includes(name)) return draft;
  if (draft.starters.length >= STARTER_COUNT) return draft;
  return {
    ...draft,
    starters: [...draft.starters, name],
    bench: without(draft.bench, name),
  };
}

export function addBench(draft: LineupDraft, name: string): LineupDraft {
  if (draft.bench.includes(name)) return draft;
  if (draft.bench.length >= BENCH_COUNT) return draft;
  return {
    ...draft,
    starters: without(draft.starters, name),
    bench: [...draft.bench, name],
    captain: draft.captain === name ? null : draft.captain,
    skills: withoutSkill(draft.skills, name),
  };
}

export function removeFromLineup(draft: LineupDraft, name: string): LineupDraft {
  return {
    ...draft,
    starters: without(draft.starters, name),
    bench: without(draft.bench, name),
    captain: draft.captain === name ? null : draft.captain,
    skills: withoutSkill(draft.skills, name),
  };
}

export function setCaptain(draft: LineupDraft, name: string): LineupDraft {
  if (!draft.starters.includes(name)) return draft;
  return { ...draft, captain: name };
}

export function moveBench(
  draft: LineupDraft,
  name: string,
  delta: number,
): LineupDraft {
  const index = draft.bench.indexOf(name);
  if (index < 0) return draft;
  const target = index + delta;
  if (target < 0 || target >= draft.bench.length) return draft;
  const bench = [...draft.bench];
  const [moved] = bench.splice(index, 1);
  bench.splice(target, 0, moved!);
  return { ...draft, bench };
}

export function setSkill(
  draft: LineupDraft,
  name: string,
  slot: number,
  skill: SkillWager | null,
): LineupDraft {
  if (!draft.starters.includes(name)) return draft;
  const allowed = name === draft.captain ? 2 : 1;
  if (slot < 0 || slot >= allowed) return draft;
  const current = draft.skills[name] ?? [];
  const next: (SkillWager | null)[] = [];
  for (let index = 0; index < allowed; index++) {
    next.push(current[index] ?? null);
  }
  next[slot] = skill;
  return { ...draft, skills: withSkill(draft.skills, name, next) };
}

export function validateLineup(
  draft: LineupDraft,
  pool: SealedPool,
): readonly LineupIssue[] {
  const issues = new Set<LineupIssue>();
  const byName = new Map(pool.basePack.map((card) => [card.footballerName, card]));

  if (draft.starters.length !== STARTER_COUNT) issues.add("wrong-starter-count");
  if (draft.bench.length !== BENCH_COUNT) issues.add("wrong-bench-count");

  const all = [...draft.starters, ...draft.bench];
  if (new Set(all).size !== all.length) issues.add("duplicate-footballer");
  if (all.some((name) => !byName.has(name))) issues.add("unknown-footballer");

  if (draft.captain === null) issues.add("missing-captain");
  else if (!draft.starters.includes(draft.captain)) issues.add("captain-not-starter");

  const starters = draft.starters
    .map((name) => byName.get(name))
    .filter((card): card is PlayerCard => card !== undefined);
  if (starters.length === STARTER_COUNT) {
    const gk = count(starters, "GK");
    const def = count(starters, "DEF");
    const mid = count(starters, "MID");
    const fwd = count(starters, "FWD");
    if (gk !== FORMATION.GK || def < FORMATION.DEF || mid < FORMATION.MID || fwd < FORMATION.FWD) {
      issues.add("formation");
    }
    const epic = starters.filter((card) => card.rarity === "epic").length;
    const superRare = starters.filter((card) => card.rarity === "superRare").length;
    if (epic > RARITY_CAPS.epic || superRare > RARITY_CAPS.superRare) {
      issues.add("rarity-cap");
    }
  }

  const clubCounts = new Map<string, number>();
  for (const name of all) {
    const card = byName.get(name);
    if (!card) continue;
    clubCounts.set(card.club, (clubCounts.get(card.club) ?? 0) + 1);
  }
  if ([...clubCounts.values()].some((n) => n > CLUB_CAP)) {
    issues.add("club-cap");
  }

  for (const [name, skills] of Object.entries(draft.skills)) {
    if (draft.bench.includes(name)) {
      issues.add("skill-on-bench");
      continue;
    }
    if (!draft.starters.includes(name)) {
      issues.add("unknown-footballer");
      continue;
    }
    const allowed = name === draft.captain ? 2 : 1;
    const worn = skills.filter((skill) => skill !== null).length;
    if (worn > allowed) {
      issues.add("too-many-skills");
    }
  }

  const packCounts = new Map<string, number>();
  for (const skill of pool.skillPack) {
    const key = skillKey(skill);
    packCounts.set(key, (packCounts.get(key) ?? 0) + 1);
  }
  const wornCounts = new Map<string, number>();
  for (const skills of Object.values(draft.skills)) {
    for (const skill of skills) {
      if (skill === null) continue;
      const key = skillKey(skill);
      wornCounts.set(key, (wornCounts.get(key) ?? 0) + 1);
    }
  }
  for (const [key, worn] of wornCounts) {
    if (worn > (packCounts.get(key) ?? 0)) {
      issues.add("skill-not-in-pool");
    }
  }

  return [...issues];
}

export function isLegalLineup(draft: LineupDraft, pool: SealedPool): boolean {
  return validateLineup(draft, pool).length === 0;
}

export function toLockedLineup(draft: LineupDraft, pool: SealedPool): LockedLineup {
  const byName = new Map(pool.basePack.map((card) => [card.footballerName, card]));
  const starters = draft.starters.map((name) => {
    const footballer = byName.get(name);
    if (!footballer) throw new Error(`unknown footballer: ${name}`);
    const isCaptain = name === draft.captain;
    const worn = draft.skills[name] ?? [];
    const skills = isCaptain
      ? [worn[0] ?? null, worn[1] ?? null]
      : [worn[0] ?? null];
    return { footballer, skills };
  });
  const bench = draft.bench.map((name) => {
    const footballer = byName.get(name);
    if (!footballer) throw new Error(`unknown footballer: ${name}`);
    return footballer;
  });
  const captainIndex =
    draft.captain === null ? -1 : draft.starters.indexOf(draft.captain);
  return { starters, bench, captainIndex };
}

export function skillKey(skill: SkillWager): string {
  return JSON.stringify(skill);
}

function count(starters: readonly PlayerCard[], position: PlayerCard["position"]): number {
  return starters.filter((card) => card.position === position).length;
}

function without<T>(list: readonly T[], item: T): T[] {
  return list.filter((entry) => entry !== item);
}

function withoutSkill(
  skills: LineupDraft["skills"],
  name: string,
): LineupDraft["skills"] {
  if (!(name in skills)) return skills;
  const copy = { ...skills };
  delete copy[name];
  return copy;
}

function withSkill(
  skills: LineupDraft["skills"],
  name: string,
  next: readonly (SkillWager | null)[],
): LineupDraft["skills"] {
  if (next.every((skill) => skill === null)) {
    return withoutSkill(skills, name);
  }
  return { ...skills, [name]: next };
}
