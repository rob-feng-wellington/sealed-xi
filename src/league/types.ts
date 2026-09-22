export interface League {
  id: string;
  name: string;
  joinCode: string;
  hostId: string;
  memberIds: readonly string[];
}

export interface LeagueStore {
  createLeague(name: string, hostId: string): Promise<League>;
  getLeagueByCode(joinCode: string): Promise<League | undefined>;
  joinLeague(managerId: string, leagueId: string): Promise<void>;
  getLeagueForManager(managerId: string): Promise<League | undefined>;
}

export type LeagueResult =
  | { kind: "ok"; league: League }
  | { kind: "invalid-name" }
  | { kind: "invalid-code" }
  | { kind: "not-found" }
  | { kind: "already-member" };
