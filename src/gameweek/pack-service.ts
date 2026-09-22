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
  async openPacks(
    managerId: string,
    gameweekId: GameweekId,
    extraPlayerPulls = 0,
  ): Promise<SealedPool> {
    const existing = await this.store.getPool(managerId, gameweekId);
    if (existing) {
      return existing;
    }
    const packs = generateGameweekPacks(this.catalogue, this.skills, this.random);
    const inPack = new Set(packs.basePack.map((card) => card.footballerName));
    const candidates = this.catalogue.filter(
      (card) => !inPack.has(card.footballerName),
    );
    const pool: SealedPool = {
      managerId,
      gameweekId,
      basePack: [
        ...packs.basePack,
        ...drawUnique(candidates, extraPlayerPulls, this.random),
      ],
      skillPack: packs.skillPack,
      ...(extraPlayerPulls > 0 ? { albumPulls: extraPlayerPulls } : {}),
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

  /**
   * Task cap top-up: append this Gameweek's earned pulls to an already-open
   * pool. Idempotent, so finishing the tasks more than once does not stack.
   */
  async grantBonusPulls(
    managerId: string,
    gameweekId: GameweekId,
    playerPulls: number,
    skillPulls: number,
  ): Promise<SealedPool | undefined> {
    const pool = await this.store.getPool(managerId, gameweekId);
    if (!pool) {
      return undefined;
    }
    const already = pool.bonusPulls ?? { player: 0, skill: 0 };
    if (already.player >= playerPulls && already.skill >= skillPulls) {
      return pool;
    }
    const takePlayers = Math.max(0, playerPulls - already.player);
    const takeSkills = Math.max(0, skillPulls - already.skill);
    const inPool = new Set(pool.basePack.map((card) => card.footballerName));
    const candidates = this.catalogue.filter(
      (card) => !inPool.has(card.footballerName),
    );
    const updated: SealedPool = {
      ...pool,
      basePack: [...pool.basePack, ...drawUnique(candidates, takePlayers, this.random)],
      skillPack: [...pool.skillPack, ...drawAny(this.skills, takeSkills, this.random)],
      bonusPulls: { player: playerPulls, skill: skillPulls },
    };
    await this.store.savePool(updated);
    return updated;
  }
}

function drawUnique<T>(
  pool: readonly T[],
  count: number,
  random: () => number,
): T[] {
  const available = [...pool];
  const drawn: T[] = [];
  for (let index = 0; index < count && available.length > 0; index++) {
    const picked = Math.floor(random() * available.length);
    drawn.push(available.splice(picked, 1)[0]!);
  }
  return drawn;
}

function drawAny<T>(
  pool: readonly T[],
  count: number,
  random: () => number,
): T[] {
  const drawn: T[] = [];
  for (let index = 0; index < count && pool.length > 0; index++) {
    drawn.push(pool[Math.floor(random() * pool.length)]!);
  }
  return drawn;
}

export function createPackService(
  store: SealedPoolStore,
  catalogue?: readonly PlayerCard[],
  skills?: readonly SkillWager[],
  random?: () => number,
): PackService {
  return new PackService(store, catalogue, skills, random);
}
