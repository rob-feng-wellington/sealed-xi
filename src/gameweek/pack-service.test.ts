import { describe, expect, it, beforeEach } from "vitest";
import { RARITY_BANDS, SKILL_CATALOGUE, type Rarity, type SkillWager } from "./catalogues.ts";
import { PackService } from "./pack-service.ts";
import { InMemoryPoolStore, LocalStoragePoolStore } from "./pool-store.ts";
import { hasPlayingRights } from "./pool.ts";
import { FOOTBALLER_CATALOGUE } from "./season-catalogue.ts";

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

describe("PackService.openPacks", () => {
  let store: InMemoryPoolStore;
  let service: PackService;

  beforeEach(() => {
    store = new InMemoryPoolStore();
    service = new PackService(store, FOOTBALLER_CATALOGUE, SKILL_CATALOGUE, rng(7));
  });

  it("opens a 24-card Base pack and a 14-card Skill pack", async () => {
    const pool = await service.openPacks("manager-1", "2025-W38");

    expect(pool.basePack).toHaveLength(24);
    expect(pool.skillPack).toHaveLength(14);
  });

  it("opens the printed Rarity and Skill band floors", async () => {
    const pool = await service.openPacks("manager-1", "2025-W38");

    expect(countBy(pool.basePack, (card) => card.rarity)).toEqual({
      epic: 2,
      superRare: 3,
      rare: 19,
    });
    const bands = countBy(pool.skillPack, (skill) => skill.band);
    expect(bands.Easy ?? 0).toBeGreaterThanOrEqual(5);
    expect(bands.Hard ?? 0).toBeGreaterThanOrEqual(5);
    expect(bands.Ultra ?? 0).toBeGreaterThanOrEqual(1);
    expect(bands.Ultra ?? 0).toBeLessThanOrEqual(3);
  });

  it("persists the pool for a refresh", async () => {
    const opened = await service.openPacks("manager-1", "2025-W38");

    const found = await service.getPool("manager-1", "2025-W38");

    expect(found).toEqual(opened);
  });

  it("returns the same pool when the Gameweek is opened twice", async () => {
    const first = await service.openPacks("manager-1", "2025-W38");
    const second = await service.openPacks("manager-1", "2025-W38");

    expect(second).toEqual(first);
  });

  it("does not carry Playing rights into the next Gameweek", async () => {
    const pool = await service.openPacks("manager-1", "2025-W38");

    expect(hasPlayingRights(pool, "2025-W38")).toBe(true);
    expect(hasPlayingRights(pool, "2025-W39")).toBe(false);
    expect(await service.getPool("manager-1", "2025-W39")).toBeUndefined();
  });

  it("keeps each manager's pool separate", async () => {
    const first = await service.openPacks("manager-1", "2025-W38");
    const second = await service.openPacks("manager-2", "2025-W38");

    expect(second.managerId).toBe("manager-2");
    await expect(service.getPool("manager-1", "2025-W38")).resolves.toEqual(first);
  });

  it("uses only catalogued footballers with a season Rarity", async () => {
    const pool = await service.openPacks("manager-1", "2025-W38");
    const known = new Set(
      FOOTBALLER_CATALOGUE.map(
        (card) => `${card.footballerName}|${card.club}|${card.rarity}`,
      ),
    );

    for (const card of pool.basePack) {
      expect(known.has(`${card.footballerName}|${card.club}|${card.rarity}`)).toBe(true);
      expect(RARITY_BANDS).toContain(card.rarity as Rarity);
    }
  });

  it("uses only the frozen Skill catalogue", async () => {
    const pool = await service.openPacks("manager-1", "2025-W38");
    const frozen = new Set(SKILL_CATALOGUE.map((skill: SkillWager) => JSON.stringify(skill)));

    for (const skill of pool.skillPack) {
      expect(frozen.has(JSON.stringify(skill))).toBe(true);
    }
  });
});

describe("LocalStoragePoolStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists an opened pool across store instances", async () => {
    const first = new LocalStoragePoolStore();
    const service = new PackService(
      first,
      FOOTBALLER_CATALOGUE,
      SKILL_CATALOGUE,
      rng(11),
    );
    const pool = await service.openPacks("manager-1", "2025-W38");

    const second = new LocalStoragePoolStore();
    const found = await second.getPool("manager-1", "2025-W38");

    expect(found).toEqual(pool);
  });
});
