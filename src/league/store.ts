import type { League, LeagueStore } from "./types.js";

const LEAGUE_STORAGE_KEY = "sealed-xi:leagues";

interface PersistedLeagueData {
  leagues: League[];
  codes: Record<string, string>;
  memberships: Record<string, string>;
  nextId: number;
}

function emptyData(): PersistedLeagueData {
  return { leagues: [], codes: {}, memberships: {}, nextId: 1 };
}

function makeJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class LocalStorageLeagueStore implements LeagueStore {
  constructor(private storage: Storage = localStorage) {}

  private load(): PersistedLeagueData {
    const raw = this.storage.getItem(LEAGUE_STORAGE_KEY);
    if (!raw) return emptyData();
    return JSON.parse(raw) as PersistedLeagueData;
  }

  private save(data: PersistedLeagueData): void {
    this.storage.setItem(LEAGUE_STORAGE_KEY, JSON.stringify(data));
  }

  async createLeague(name: string, hostId: string): Promise<League> {
    const data = this.load();
    let joinCode = makeJoinCode();
    while (data.codes[joinCode]) {
      joinCode = makeJoinCode();
    }
    const id = String(data.nextId++);
    const league: League = {
      id,
      name: name.trim(),
      joinCode,
      hostId,
      memberIds: [hostId],
    };
    data.leagues.push(league);
    data.codes[joinCode] = id;
    data.memberships[hostId] = id;
    this.save(data);
    return league;
  }

  async getLeagueByCode(joinCode: string): Promise<League | undefined> {
    const data = this.load();
    const id = data.codes[joinCode.trim().toUpperCase()];
    if (!id) return undefined;
    return data.leagues.find((league) => league.id === id);
  }

  async joinLeague(managerId: string, leagueId: string): Promise<void> {
    const data = this.load();
    const league = data.leagues.find((l) => l.id === leagueId);
    if (!league) return;
    if (!league.memberIds.includes(managerId)) {
      league.memberIds = [...league.memberIds, managerId];
    }
    data.memberships[managerId] = leagueId;
    this.save(data);
  }

  async getLeagueForManager(managerId: string): Promise<League | undefined> {
    const data = this.load();
    const id = data.memberships[managerId];
    if (!id) return undefined;
    return data.leagues.find((league) => league.id === id);
  }
}

export class InMemoryLeagueStore implements LeagueStore {
  private leagues = new Map<string, League>();
  private codes = new Map<string, string>();
  private memberships = new Map<string, string>();
  private nextId = 1;

  async createLeague(name: string, hostId: string): Promise<League> {
    let joinCode = makeJoinCode();
    while (this.codes.has(joinCode)) {
      joinCode = makeJoinCode();
    }
    const id = String(this.nextId++);
    const league: League = {
      id,
      name: name.trim(),
      joinCode,
      hostId,
      memberIds: [hostId],
    };
    this.leagues.set(id, league);
    this.codes.set(joinCode, id);
    this.memberships.set(hostId, id);
    return league;
  }

  async getLeagueByCode(joinCode: string): Promise<League | undefined> {
    const id = this.codes.get(joinCode.trim().toUpperCase());
    if (!id) return undefined;
    return this.leagues.get(id);
  }

  async joinLeague(managerId: string, leagueId: string): Promise<void> {
    const league = this.leagues.get(leagueId);
    if (!league) return;
    if (!league.memberIds.includes(managerId)) {
      league.memberIds = [...league.memberIds, managerId];
    }
    this.memberships.set(managerId, leagueId);
  }

  async getLeagueForManager(managerId: string): Promise<League | undefined> {
    const id = this.memberships.get(managerId);
    if (!id) return undefined;
    return this.leagues.get(id);
  }

  clear(): void {
    this.leagues.clear();
    this.codes.clear();
    this.memberships.clear();
    this.nextId = 1;
  }
}
