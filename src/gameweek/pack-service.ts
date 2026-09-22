import { SKILL_CATALOGUE, type SkillWager } from "./catalogues.ts";
import { generateGameweekPacks, type PlayerCard } from "./generate-packs.ts";
import type { GameweekId } from "./gameweek.ts";
import type { SealedPool } from "./pool.ts";
import type { SealedPoolStore } from "./pool-store.ts";
import { FOOTBALLER_CATALOGUE } from "./season-catalogue.ts";

export class PackService {
  constructor(
    private store: SealedPoolStore,
    private catalogue: readonly PlayerCard[] = FOOTBALLER_CATALOGUE,
    private skills: readonly SkillWager[] = SKILL_CATALOGUE,
    private random: () => number = Math.random,
  ) {}

  /**
   * Open this Gameweek's packs once. A pool already open for the Gameweek is
   * returned unchanged, so Playing rights survive a refresh but never roll over
   * into the next Gameweek.
   */
  async openPacks(managerId: string, gameweekId: GameweekId): Promise<SealedPool> {
    const existing = await this.store.getPool(managerId, gameweekId);
    if (existing) {
      return existing;
    }
    const packs = generateGameweekPacks(this.catalogue, this.skills, this.random);
    const pool: SealedPool = {
      managerId,
      gameweekId,
      basePack: packs.basePack,
      skillPack: packs.skillPack,
    };
    await this.store.savePool(pool);
    return pool;
  }

  async getPool(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<SealedPool | undefined> {
    return this.store.getPool(managerId, gameweekId);
  }
}

export function createPackService(
  store: SealedPoolStore,
  catalogue?: readonly PlayerCard[],
  skills?: readonly SkillWager[],
  random?: () => number,
): PackService {
  return new PackService(store, catalogue, skills, random);
}
