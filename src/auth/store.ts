import type { Manager } from "./types.js";

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
