import { describe, expect, it } from "vitest";
import { RARITY_BANDS, SKILL_CATALOGUE, type Rarity, type SkillWager } from "./catalogues.ts";
import {
  allowsLegalLineup,
  generateGameweekPacks,
  type PlayerCard,
} from "./generate-packs.ts";
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

function card(
  club: string,
  position: Position,
  rarity: Rarity,
  copy: number,
): PlayerCard {
  return {
    footballerName: `${club} ${position} ${rarity} ${copy}`,
    club,
    position,
    rarity,
  };
}

function footballerCatalogue(clubNames: readonly string[] = clubs): PlayerCard[] {
  const cards: PlayerCard[] = [];
  for (const club of clubNames) {
    for (const position of positions) {
      for (const rarity of rarities) {
        for (let copy = 0; copy < 3; copy++) {
          cards.push(card(club, position, rarity, copy));
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

describe("generateGameweekPacks", () => {
  it("opens a Base pack of 24 Player cards", () => {
    const packs = generateGameweekPacks(footballerCatalogue(), SKILL_CATALOGUE, rng(1));

    expect(packs.basePack).toHaveLength(24);
  });

  it("deals 2 epic, 3 super rare, and 19 rare", () => {
    const packs = generateGameweekPacks(footballerCatalogue(), SKILL_CATALOGUE, rng(2));

    expect(countBy(packs.basePack, (c) => c.rarity)).toEqual({
      epic: 2,
      superRare: 3,
      rare: 19,
    });
  });

  it("meets the position floor of 2 GK, 4 DEF, 4 MID, 2 FWD", () => {
    const packs = generateGameweekPacks(footballerCatalogue(), SKILL_CATALOGUE, rng(3));
    const pos = countBy(packs.basePack, (c) => c.position);

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
    const bands = countBy(packs.skillPack, (s) => s.band);

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

  it("always deals a pool that assembles a legal Lineup", () => {
    for (const seed of [7, 8, 9, 10, 11, 12, 13, 14, 15, 16]) {
      const packs = generateGameweekPacks(footballerCatalogue(), SKILL_CATALOGUE, rng(seed));

      expect(allowsLegalLineup(packs.basePack)).toBe(true);
    }
  });

  it("always deals a legal pool even when the catalogue has only 5 Clubs", () => {
    const tight = footballerCatalogue(clubs.slice(0, 5));
    for (const seed of [17, 18, 19, 20, 21]) {
      const packs = generateGameweekPacks(tight, SKILL_CATALOGUE, rng(seed));

      expect(allowsLegalLineup(packs.basePack)).toBe(true);
    }
  });

  it("rejects a catalogue that can never assemble a legal Lineup", () => {
    const fourClubs = footballerCatalogue(clubs.slice(0, 4));

    expect(() => generateGameweekPacks(fourClubs, SKILL_CATALOGUE, rng(22))).toThrow();
  });
});

describe("allowsLegalLineup", () => {
  function pool(
    gk: number,
    def: number,
    mid: number,
    fwd: number,
    clubNames: readonly string[],
    rarity: Rarity = "rare",
  ): PlayerCard[] {
    const cards: PlayerCard[] = [];
    const counts = { GK: gk, DEF: def, MID: mid, FWD: fwd };
    let n = 0;
    for (const position of positions) {
      for (let i = 0; i < counts[position]; i++) {
        const club = clubNames[n % clubNames.length]!;
        cards.push(card(club, position, rarity, n));
        n++;
      }
    }
    return cards;
  }

  it("accepts 15 cards covering 1 GK, 3 DEF, 2 MID, 1 FWD across 5 Clubs", () => {
    expect(allowsLegalLineup(pool(2, 5, 5, 3, clubs.slice(0, 5)))).toBe(true);
  });

  it("rejects a pool with no goalkeeper", () => {
    expect(allowsLegalLineup(pool(0, 6, 6, 3, clubs))).toBe(false);
  });

  it("rejects a pool with only 2 defenders", () => {
    expect(allowsLegalLineup(pool(2, 2, 6, 5, clubs))).toBe(false);
  });

  it("rejects a pool where one Club passes the cap of 3 in every 15", () => {
    const cards = pool(2, 5, 5, 3, clubs.slice(0, 4));

    expect(allowsLegalLineup(cards)).toBe(false);
  });

  it("rejects a pool whose epic cards exceed the cap in every starting 11", () => {
    const epicHeavy = [
      ...pool(1, 4, 4, 3, clubs, "epic"),
      ...pool(1, 1, 1, 0, clubs, "rare"),
    ];

    expect(allowsLegalLineup(epicHeavy)).toBe(false);
  });

  it("accepts a pool that benches its fourth epic", () => {
    const fourEpics = [
      ...pool(0, 1, 1, 2, clubs, "epic"),
      ...pool(2, 3, 4, 2, clubs, "rare"),
    ];

    expect(allowsLegalLineup(fourEpics)).toBe(true);
  });
});