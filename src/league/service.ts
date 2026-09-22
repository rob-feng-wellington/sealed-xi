import type { League, LeagueResult, LeagueStore } from "./types.js";

export function validateLeagueName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 30;
}

export function validateJoinCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.trim().toUpperCase());
}

export class LeagueService {
  constructor(private store: LeagueStore) {}

  async createLeague(name: string, hostId: string): Promise<LeagueResult> {
    if (!validateLeagueName(name)) {
      return { kind: "invalid-name" };
    }
    const existing = await this.store.getLeagueForManager(hostId);
    if (existing) {
      return { kind: "already-member" };
    }
    const league = await this.store.createLeague(name, hostId);
    return { kind: "ok", league };
  }

  async joinLeague(managerId: string, code: string): Promise<LeagueResult> {
    if (!validateJoinCode(code)) {
      return { kind: "invalid-code" };
    }
    const existing = await this.store.getLeagueForManager(managerId);
    if (existing) {
      return { kind: "already-member" };
    }
    const league = await this.store.getLeagueByCode(code);
    if (!league) {
      return { kind: "not-found" };
    }
    await this.store.joinLeague(managerId, league.id);
    return { kind: "ok", league };
  }

  async getLeagueForManager(managerId: string): Promise<League | undefined> {
    return this.store.getLeagueForManager(managerId);
  }
}

export function createLeagueService(store: LeagueStore): LeagueService {
  return new LeagueService(store);
}
