import type { SkillWager } from "./catalogues.ts";
import type { PlayerCard } from "./generate-packs.ts";
import type { GameweekId } from "./gameweek.ts";

/**
 * This Gameweek's Sealed pool: the Base pack and Skill pack opened before the
 * Deadline. It is not a standing collection; Playing rights expire with the
 * Gameweek.
 */
export type SealedPool = {
  managerId: string;
  gameweekId: GameweekId;
  basePack: readonly PlayerCard[];
  skillPack: readonly SkillWager[];
};

export function hasPlayingRights(pool: SealedPool, gameweekId: GameweekId): boolean {
  return pool.gameweekId === gameweekId;
}
