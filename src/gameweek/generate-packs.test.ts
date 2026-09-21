import { describe, expect, it } from "vitest";
import { RARITY_BANDS, SKILL_CATALOGUE, type SkillWager } from "./catalogues.ts";
import { generateGameweekPacks, type PlayerCard } from "./generate-packs.ts";
import type { Position } from "./settle-match-points.ts";

const clubs = [
  "Arsenal",
  "Chelsea",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Tottenham",
  "Newcastle",
  "Aston Villa",
  "Brighton",
  "West Ham",
] as const;

const positions: readonly Position[] = ["GK", "DEF", "MID", "FWD"];
const rarities = RARITY_BANDS;

function footballerCatalogue(): PlayerCard[] {
  const cards: PlayerCard[] = [];
  for (const club of clubs) {
    for (const position of positions) {
      for (const rarity of rarities) {
        for (let copy = 0; copy < 3; copy++) {
          cards.push({
            footballerName: `${club} ${position} ${rarity} ${copy}`,
            club,
            position,
            rarity,
          });
        }
      }
    }
  }
  return cards;
}

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function countBy<Item, Key extends string>(
  items: readonly Item[],
  key: (item: Item) => Key,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const value = key(item);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function skillKey(skill: SkillWager): string {
  return JSON.stringify(skill);
}

function canAssembleLegalLineup(pool: readonly PlayerCard[]): boolean {
  return searchRoster(pool, 0, [], new Map());
}

function searchRoster(
  pool: readonly PlayerCard[],
  index: number,
  chosen: PlayerCard[],
  clubCounts: Map<string, number>,
): boolean {
  if (chosen.length === 15) {
    return hasLegalStarters(chosen);
  }
  if (index >= pool.length || chosen.length + (pool.length - index) < 15) {
    return false;
  }

  const card = pool[index]!;
  const used = clubCounts.get(card.club) ?? 0;
  if (used < 3) {
    clubCounts.set(card.club, used + 1);
    chosen.push(card);
    if (searchRoster(pool, index + 1, chosen, clubCounts)) {
      return true;
    }
    chosen.pop();
    clubCounts.set(card.club, used);
  }

  return searchRoster(pool, index + 1, chosen, clubCounts);
}

function hasLegalStarters(roster: readonly PlayerCard[]): boolean {
  const n = roster.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    if (bitCount(mask) !== 11) {
      continue;
    }
    const starters: PlayerCard[] = [];
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) {
        starters.push(roster[i]!);
      }
    }
    if (isLegalStartingEleven(starters)) {
      return true;
    }
  }
  return false;
}

function isLegalStartingEleven(starters: readonly PlayerCard[]): boolean {
  const pos = countBy(starters, (card: PlayerCard) => card.position);
  if ((pos.GK ?? 0) !== 1) {
    return false;
  }
  if ((pos.DEF ?? 0) < 3 || (pos.MID ?? 0) < 2 || (pos.FWD ?? 0) < 1) {
    return false;
  }
  const rarity = countBy(starters, (card: PlayerCard) => card.rarity);
  return (rarity.epic ?? 0) <= 3 && (rarity.superRare ?? 0) <= 4;
}

function bitCount(mask: number): number {
  let count = 0;
  while (mask !== 0) {
    count += mask & 1;
    mask >>>= 1;
  }
  return count;
}

describe("generateGameweekPacks", () => {
  it("opens a Base pack of 24 Player cards", () => {
    const packs = generateGameweekPacks(footballerCatalogue(), SKILL_CATALOGUE, rng(1));

    expect(packs.basePack).toHaveLength(24);
  });

  it("deals 2 epic, 3 super rare, and 19 rare", () => {
    const packs = generateGameweekPacks(footballerCatalogue(), SKILL_CATALOGUE, rng(2));

    expect(countBy(packs.basePack, (card: PlayerCard) => card.rarity)).toEqual({
      epic: 2,
      superRare: 3,
      rare: 19,
    });
  });

  it("meets the position floor of 2 GK, 4 DEF, 4 MID, 2 FWD", () => {
    const packs = generateGameweekPacks(footballerCatalogue(), SKILL_CATALOGUE, rng(3));
    const pos = countBy(packs.basePack, (card: PlayerCard) => card.position);

    expect(pos.GK ?? 0).toBeGreaterThanOrEqual(2);
    expect(pos.DEF ?? 0).toBeGreaterThanOrEqual(4);
    expect(pos.MID ?? 0).toBeGreaterThanOrEqual(4);
    expect(pos.FWD ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("opens a Skill pack of 14 Skill cards", () => {
    const packs = generateGameweekPacks(footballerCatalogue(), SKILL_CATALOGUE, rng(4));

    expect(packs.skillPack).toHaveLength(14);
  });

  it("deals at least 5 Easy, 5 Hard, and 1-3 Ultra Skill cards", () => {
    const packs = generateGameweekPacks(footballerCatalogue(), SKILL_CATALOGUE, rng(5));
    const bands = countBy(packs.skillPack, (skill: SkillWager) => skill.band);

    expect(bands.Easy ?? 0).toBeGreaterThanOrEqual(5);
    expect(bands.Hard ?? 0).toBeGreaterThanOrEqual(5);
    expect(bands.Ultra ?? 0).toBeGreaterThanOrEqual(1);
    expect(bands.Ultra ?? 0).toBeLessThanOrEqual(3);
  });

  it("allows duplicate Skill cards in one Skill pack", () => {
    const tinySkills: SkillWager[] = [
      SKILL_CATALOGUE[0]!,
      SKILL_CATALOGUE[1]!,
      SKILL_CATALOGUE[7]!,
      SKILL_CATALOGUE[8]!,
      SKILL_CATALOGUE[14]!,
    ];
    const packs = generateGameweekPacks(footballerCatalogue(), tinySkills, rng(6));
    const keys = packs.skillPack.map(skillKey);

    expect(keys).toHaveLength(14);
    expect(new Set(keys).size).toBeLessThan(keys.length);
  });

  it("can always assemble a legal Lineup from the generated pool", () => {
    for (const seed of [7, 8, 9, 10, 11, 12, 13, 14, 15, 16]) {
      const packs = generateGameweekPacks(footballerCatalogue(), SKILL_CATALOGUE, rng(seed));

      expect(canAssembleLegalLineup(packs.basePack)).toBe(true);
    }
  });
});
