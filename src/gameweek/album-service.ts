import { completedClubSets, emptyAlbum, type AlbumState } from "./album.ts";
import type { AlbumStore } from "./album-store.ts";
import { nextGameweekId, type GameweekId } from "./gameweek.ts";
import type { PackService } from "./pack-service.ts";
import type { SealedPool } from "./pool.ts";

export type AlbumDrawResult = {
  state: AlbumState;
  newStamps: readonly string[];
  completedNow: readonly string[];
  albumPullFor: GameweekId | null;
};

export class AlbumService {
  constructor(private store: AlbumStore) {}

  async getState(managerId: string): Promise<AlbumState> {
    return (await this.store.getState(managerId)) ?? emptyAlbum(managerId);
  }

  /**
   * Stamp every unique footballer drawn this Gameweek. Completing a Club set
   * schedules a +1 player pull for the following Gameweek; multiple completions
   * in one Gameweek still schedule only one.
   */
  async recordDraw(
    managerId: string,
    gameweekId: GameweekId,
    footballers: readonly { footballerName: string }[],
  ): Promise<AlbumDrawResult> {
    const state = await this.getState(managerId);
    const owned = new Set(state.stamps);
    const newStamps: string[] = [];
    for (const footballer of footballers) {
      if (!owned.has(footballer.footballerName)) {
        owned.add(footballer.footballerName);
        newStamps.push(footballer.footballerName);
      }
    }

    const stamps = [...state.stamps, ...newStamps];
    const completedBefore = completedClubSets(state.stamps);
    const completedNow = completedClubSets(stamps).filter(
      (club) => !completedBefore.includes(club),
    );
    const albumPullFor =
      completedNow.length > 0 ? nextGameweekId(gameweekId) : state.albumPullFor;

    const next: AlbumState = { managerId, stamps, albumPullFor };
    await this.store.saveState(next);
    return {
      state: next,
      newStamps,
      completedNow,
      albumPullFor: completedNow.length > 0 ? albumPullFor : null,
    };
  }

  /** The number of extra player pulls owed for this Gameweek (0 or 1). */
  async pullForGameweek(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<number> {
    const state = await this.getState(managerId);
    return state.albumPullFor === gameweekId ? 1 : 0;
  }

  async markPullGranted(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<AlbumState> {
    const state = await this.getState(managerId);
    if (state.albumPullFor !== gameweekId) {
      return state;
    }
    const next: AlbumState = { ...state, albumPullFor: null };
    await this.store.saveState(next);
    return next;
  }

  /**
   * Open this Gameweek's packs with the Album pull applied, then stamp the
   * draw. The pull is consumed even on a refresh so it cannot be double-spent.
   */
  async openGameweekPacks(
    managerId: string,
    gameweekId: GameweekId,
    packs: PackService,
  ): Promise<SealedPool> {
    const existing = await packs.getPool(managerId, gameweekId);
    const pull = existing ? 0 : await this.pullForGameweek(managerId, gameweekId);
    const pool = await packs.openPacks(managerId, gameweekId, pull);
    if (pull > 0) {
      await this.markPullGranted(managerId, gameweekId);
    }
    await this.recordDraw(managerId, gameweekId, pool.basePack);
    return pool;
  }
}

export function createAlbumService(store: AlbumStore): AlbumService {
  return new AlbumService(store);
}
