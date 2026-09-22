import type { GameweekId } from "./gameweek.ts";
import type { SealedPool } from "./pool.ts";

export interface SealedPoolStore {
  getPool(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<SealedPool | undefined>;
  savePool(pool: SealedPool): Promise<void>;
}

const POOL_STORAGE_KEY = "sealed-xi:pools";

interface PersistedPoolData {
  pools: Record<string, SealedPool>;
}

function poolKey(managerId: string, gameweekId: GameweekId): string {
  return `${managerId}:${gameweekId}`;
}

export class LocalStoragePoolStore implements SealedPoolStore {
  constructor(private storage: Storage = localStorage) {}

  private load(): PersistedPoolData {
    const raw = this.storage.getItem(POOL_STORAGE_KEY);
    if (!raw) return { pools: {} };
    return JSON.parse(raw) as PersistedPoolData;
  }

  private save(data: PersistedPoolData): void {
    this.storage.setItem(POOL_STORAGE_KEY, JSON.stringify(data));
  }

  async getPool(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<SealedPool | undefined> {
    return this.load().pools[poolKey(managerId, gameweekId)];
  }

  async savePool(pool: SealedPool): Promise<void> {
    const data = this.load();
    data.pools[poolKey(pool.managerId, pool.gameweekId)] = pool;
    this.save(data);
  }
}

export class InMemoryPoolStore implements SealedPoolStore {
  private pools = new Map<string, SealedPool>();

  async getPool(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<SealedPool | undefined> {
    return this.pools.get(poolKey(managerId, gameweekId));
  }

  async savePool(pool: SealedPool): Promise<void> {
    this.pools.set(poolKey(pool.managerId, pool.gameweekId), pool);
  }

  clear(): void {
    this.pools.clear();
  }
}
