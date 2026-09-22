import type { GameweekId } from "./gameweek.ts";
import type { TaskCapState } from "./task-cap.ts";

export interface TaskCapStore {
  getState(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<TaskCapState | undefined>;
  saveState(state: TaskCapState): Promise<void>;
}

const TASK_CAP_STORAGE_KEY = "sealed-xi:task-cap";

interface PersistedTaskCapData {
  states: Record<string, TaskCapState>;
}

function stateKey(managerId: string, gameweekId: GameweekId): string {
  return `${managerId}:${gameweekId}`;
}

export class LocalStorageTaskCapStore implements TaskCapStore {
  constructor(private storage: Storage = localStorage) {}

  private load(): PersistedTaskCapData {
    const raw = this.storage.getItem(TASK_CAP_STORAGE_KEY);
    if (!raw) return { states: {} };
    return JSON.parse(raw) as PersistedTaskCapData;
  }

  private save(data: PersistedTaskCapData): void {
    this.storage.setItem(TASK_CAP_STORAGE_KEY, JSON.stringify(data));
  }

  async getState(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<TaskCapState | undefined> {
    return this.load().states[stateKey(managerId, gameweekId)];
  }

  async saveState(state: TaskCapState): Promise<void> {
    const data = this.load();
    data.states[stateKey(state.managerId, state.gameweekId)] = state;
    this.save(data);
  }
}

export class InMemoryTaskCapStore implements TaskCapStore {
  private states = new Map<string, TaskCapState>();

  async getState(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<TaskCapState | undefined> {
    return this.states.get(stateKey(managerId, gameweekId));
  }

  async saveState(state: TaskCapState): Promise<void> {
    this.states.set(stateKey(state.managerId, state.gameweekId), state);
  }

  clear(): void {
    this.states.clear();
  }
}
