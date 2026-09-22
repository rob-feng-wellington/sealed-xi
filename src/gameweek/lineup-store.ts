import type { GameweekId } from "./gameweek.ts";
import type { LineupDraft } from "./lineup.ts";

export type LineupStatus = "tentative" | "locked";

export type LineupState = {
  managerId: string;
  gameweekId: GameweekId;
  status: LineupStatus;
  draft: LineupDraft;
};

export interface LineupStore {
  getState(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<LineupState | undefined>;
  saveState(state: LineupState): Promise<void>;
}

const LINEUP_STORAGE_KEY = "sealed-xi:lineups";

interface PersistedLineupData {
  lineups: Record<string, LineupState>;
}

function lineupKey(managerId: string, gameweekId: GameweekId): string {
  return `${managerId}:${gameweekId}`;
}

export class LocalStorageLineupStore implements LineupStore {
  constructor(private storage: Storage = localStorage) {}

  private load(): PersistedLineupData {
    const raw = this.storage.getItem(LINEUP_STORAGE_KEY);
    if (!raw) return { lineups: {} };
    return JSON.parse(raw) as PersistedLineupData;
  }

  private save(data: PersistedLineupData): void {
    this.storage.setItem(LINEUP_STORAGE_KEY, JSON.stringify(data));
  }

  async getState(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<LineupState | undefined> {
    return this.load().lineups[lineupKey(managerId, gameweekId)];
  }

  async saveState(state: LineupState): Promise<void> {
    const data = this.load();
    data.lineups[lineupKey(state.managerId, state.gameweekId)] = state;
    this.save(data);
  }
}

export class InMemoryLineupStore implements LineupStore {
  private lineups = new Map<string, LineupState>();

  async getState(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<LineupState | undefined> {
    return this.lineups.get(lineupKey(managerId, gameweekId));
  }

  async saveState(state: LineupState): Promise<void> {
    this.lineups.set(lineupKey(state.managerId, state.gameweekId), state);
  }

  clear(): void {
    this.lineups.clear();
  }
}
