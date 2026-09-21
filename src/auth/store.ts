import type { AuthStore, Manager } from "./types.js";

const AUTH_STORAGE_KEY = "sealed-xi:auth";
const SESSION_STORAGE_KEY = "sealed-xi:session";

interface PersistedAuthData {
  managers: Manager[];
  usernames: Record<string, string>;
  nextId: number;
}

function emptyAuthData(): PersistedAuthData {
  return { managers: [], usernames: {}, nextId: 1 };
}

export function readSessionManager(storage: Storage = localStorage): Manager | null {
  const raw = storage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as Manager;
}

export function writeSessionManager(
  manager: Manager | null,
  storage: Storage = localStorage,
): void {
  if (manager === null) {
    storage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(manager));
}

export class LocalStorageAuthStore implements AuthStore {
  constructor(private storage: Storage = localStorage) {}

  private load(): PersistedAuthData {
    const raw = this.storage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return emptyAuthData();
    return JSON.parse(raw) as PersistedAuthData;
  }

  private save(data: PersistedAuthData): void {
    this.storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  }

  async getManager(id: string): Promise<Manager | undefined> {
    const data = this.load();
    return data.managers.find((m) => m.id === id);
  }

  async getManagerByUsername(username: string): Promise<Manager | undefined> {
    const data = this.load();
    const id = data.usernames[username];
    if (!id) return undefined;
    return data.managers.find((m) => m.id === id);
  }

  async createManager(username: string): Promise<Manager> {
    const data = this.load();
    const id = String(data.nextId++);
    const manager: Manager = { id, username };
    data.managers.push(manager);
    data.usernames[username] = id;
    this.save(data);
    return manager;
  }
}

export class InMemoryAuthStore {
  private managers = new Map<string, Manager>();
  private usernames = new Map<string, string>();
  private nextId = 1;

  async getManager(id: string): Promise<Manager | undefined> {
    return this.managers.get(id);
  }

  async getManagerByUsername(username: string): Promise<Manager | undefined> {
    const id = this.usernames.get(username);
    if (!id) return undefined;
    return this.managers.get(id);
  }

  async createManager(username: string): Promise<Manager> {
    const id = String(this.nextId++);
    const manager: Manager = { id, username };
    this.managers.set(id, manager);
    this.usernames.set(username, id);
    return manager;
  }

  clear(): void {
    this.managers.clear();
    this.usernames.clear();
    this.nextId = 1;
  }
}
