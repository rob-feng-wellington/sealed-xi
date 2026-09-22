import { describe, expect, it } from "vitest";
import { RARITY_BANDS, SKILL_CATALOGUE } from "./catalogues.ts";
import { allowsLegalLineup, generateGameweekPacks } from "./generate-packs.ts";
import { FOOTBALLER_CATALOGUE } from "./season-catalogue.ts";

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("FOOTBALLER_CATALOGUE", () => {
  it("gives every footballer one season Rarity from the printed bands", () => {
    for (const card of FOOTBALLER_CATALOGUE) {
      expect(RARITY_BANDS).toContain(card.rarity);
      expect(card.footballerName.length).toBeGreaterThan(0);
      expect(card.club.length).toBeGreaterThan(0);
    }
  });

  it("publishes enough Clubs to respect the Club cap in a legal Lineup", () => {
    const clubs = new Set(FOOTBALLER_CATALOGUE.map((card) => card.club));

    expect(clubs.size).toBeGreaterThanOrEqual(5);
  });

  it("always deals a pool that assembles a legal Lineup", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const packs = generateGameweekPacks(
        FOOTBALLER_CATALOGUE,
        SKILL_CATALOGUE,
        rng(seed),
      );

      expect(packs.basePack).toHaveLength(24);
      expect(packs.skillPack).toHaveLength(14);
      expect(allowsLegalLineup(packs.basePack)).toBe(true);
    }
  });
});
