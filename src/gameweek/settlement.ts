import type { GameweekId } from "./gameweek.ts";
import type { LockedLineup, SettledSlot } from "./settle-lineup.ts";

/**
 * A manager's settled Gameweek: the frozen Lineup, the per-slot breakdown, and
 * the totals written after the fixtures finish.
 */
export type ManagerSettlement = {
  managerId: string;
  gameweekId: GameweekId;
  lineup: LockedLineup;
  slots: readonly SettledSlot[];
  matchPoints: number;
  skillPoints: number;
  total: number;
};

export interface SettlementStore {
  saveSettlement(settlement: ManagerSettlement): Promise<void>;
  getSettlement(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<ManagerSettlement | undefined>;
  getGameweekSettlements(
    gameweekId: GameweekId,
  ): Promise<readonly ManagerSettlement[]>;
  getManagerSettlements(managerId: string): Promise<readonly ManagerSettlement[]>;
}

const SETTLEMENT_STORAGE_KEY = "sealed-xi:settlements";

interface PersistedSettlementData {
  settlements: Record<string, ManagerSettlement>;
}

function settlementKey(managerId: string, gameweekId: GameweekId): string {
  return `${managerId}:${gameweekId}`;
}

export class LocalStorageSettlementStore implements SettlementStore {
  constructor(private storage: Storage = localStorage) {}

  private load(): PersistedSettlementData {
    const raw = this.storage.getItem(SETTLEMENT_STORAGE_KEY);
    if (!raw) return { settlements: {} };
    return JSON.parse(raw) as PersistedSettlementData;
  }

  private save(data: PersistedSettlementData): void {
    this.storage.setItem(SETTLEMENT_STORAGE_KEY, JSON.stringify(data));
  }

  async saveSettlement(settlement: ManagerSettlement): Promise<void> {
    const data = this.load();
    data.settlements[settlementKey(settlement.managerId, settlement.gameweekId)] =
      settlement;
    this.save(data);
  }

  async getSettlement(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<ManagerSettlement | undefined> {
    return this.load().settlements[settlementKey(managerId, gameweekId)];
  }

  async getGameweekSettlements(
    gameweekId: GameweekId,
  ): Promise<readonly ManagerSettlement[]> {
    return Object.values(this.load().settlements).filter(
      (settlement) => settlement.gameweekId === gameweekId,
    );
  }

  async getManagerSettlements(
    managerId: string,
  ): Promise<readonly ManagerSettlement[]> {
    return Object.values(this.load().settlements).filter(
      (settlement) => settlement.managerId === managerId,
    );
  }
}

export class InMemorySettlementStore implements SettlementStore {
  private settlements = new Map<string, ManagerSettlement>();

  async saveSettlement(settlement: ManagerSettlement): Promise<void> {
    this.settlements.set(
      settlementKey(settlement.managerId, settlement.gameweekId),
      settlement,
    );
  }

  async getSettlement(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<ManagerSettlement | undefined> {
    return this.settlements.get(settlementKey(managerId, gameweekId));
  }

  async getGameweekSettlements(
    gameweekId: GameweekId,
  ): Promise<readonly ManagerSettlement[]> {
    return [...this.settlements.values()].filter(
      (settlement) => settlement.gameweekId === gameweekId,
    );
  }

  async getManagerSettlements(
    managerId: string,
  ): Promise<readonly ManagerSettlement[]> {
    return [...this.settlements.values()].filter(
      (settlement) => settlement.managerId === managerId,
    );
  }

  clear(): void {
    this.settlements.clear();
  }
}
