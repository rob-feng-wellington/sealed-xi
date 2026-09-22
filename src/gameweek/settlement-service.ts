import type { League } from "../league/types.js";
import {
  deadlineFromFirstKickoff,
  isPastDeadline,
  scheduledFirstKickoff,
} from "./deadline.ts";
import type { GameweekId } from "./gameweek.ts";
import { toLockedLineup } from "./lineup.ts";
import type { KickoffSchedule } from "./lineup-service.ts";
import type { LineupStore } from "./lineup-store.ts";
import type { MatchFactsStore } from "./match-facts-store.ts";
import type { SealedPoolStore } from "./pool-store.ts";
import {
  settleLineup,
  type FootballerMatchFacts,
  type LockedLineup,
} from "./settle-lineup.ts";
import type { ManagerSettlement, SettlementStore } from "./settlement.ts";

export type SettleResult =
  | { kind: "ok"; settlements: readonly ManagerSettlement[] }
  | { kind: "too-early" };

export type LeagueTableRow = {
  managerId: string;
  gameweekPoints: number;
  seasonPoints: number;
};

const EMPTY_LINEUP: LockedLineup = { starters: [], bench: [], captainIndex: -1 };

export class SettlementService {
  constructor(
    private settlements: SettlementStore,
    private lineups: LineupStore,
    private pools: SealedPoolStore,
    private matchFacts: MatchFactsStore,
    private schedule: KickoffSchedule = scheduledFirstKickoff,
  ) {}

  deadline(gameweekId: GameweekId): Date {
    return deadlineFromFirstKickoff(this.schedule(gameweekId));
  }

  /**
   * Settle every league member from the finished fixtures. Refuses before the
   * Deadline so there is no live in-play scoring. Idempotent: re-settling
   * overwrites the same Gameweek results.
   */
  async settleLeague(
    league: League,
    gameweekId: GameweekId,
    now: Date,
  ): Promise<SettleResult> {
    if (!isPastDeadline(now, this.deadline(gameweekId))) {
      return { kind: "too-early" };
    }

    const facts = await this.matchFacts.getFacts(gameweekId);
    const settlements: ManagerSettlement[] = [];

    for (const managerId of league.memberIds) {
      const settle = await this.settleManager(managerId, gameweekId, facts);
      await this.settlements.saveSettlement(settle);
      settlements.push(settle);
    }

    return { kind: "ok", settlements };
  }

  async seasonTotal(managerId: string): Promise<number> {
    const all = await this.settlements.getManagerSettlements(managerId);
    return all.reduce((sum, settlement) => sum + settlement.total, 0);
  }

  async leagueTable(
    league: League,
    gameweekId: GameweekId,
  ): Promise<readonly LeagueTableRow[]> {
    const rows: LeagueTableRow[] = [];
    for (const managerId of league.memberIds) {
      const settlement = await this.settlements.getSettlement(managerId, gameweekId);
      rows.push({
        managerId,
        gameweekPoints: settlement?.total ?? 0,
        seasonPoints: await this.seasonTotal(managerId),
      });
    }
    return rows;
  }

  async settlementsForLeague(
    league: League,
    gameweekId: GameweekId,
  ): Promise<readonly ManagerSettlement[]> {
    const all = await this.settlements.getGameweekSettlements(gameweekId);
    const byManager = new Map(all.map((settlement) => [settlement.managerId, settlement]));
    return league.memberIds
      .map((managerId) => byManager.get(managerId))
      .filter((settlement): settlement is ManagerSettlement => settlement !== undefined);
  }

  private async settleManager(
    managerId: string,
    gameweekId: GameweekId,
    facts: ReadonlyMap<string, readonly FootballerMatchFacts[]>,
  ): Promise<ManagerSettlement> {
    const state = await this.lineups.getState(managerId, gameweekId);
    const pool = await this.pools.getPool(managerId, gameweekId);

    if (!state || !pool) {
      return {
        managerId,
        gameweekId,
        lineup: EMPTY_LINEUP,
        slots: [],
        matchPoints: 0,
        skillPoints: 0,
        total: 0,
      };
    }

    const lineup = toLockedLineup(state.draft, pool);
    const settled = settleLineup(lineup, facts);
    return {
      managerId,
      gameweekId,
      lineup,
      slots: settled.slots,
      matchPoints: settled.totalMatchPoints,
      skillPoints: settled.totalSkillPoints,
      total: settled.total,
    };
  }
}

export function createSettlementService(
  settlements: SettlementStore,
  lineups: LineupStore,
  pools: SealedPoolStore,
  matchFacts: MatchFactsStore,
  schedule?: KickoffSchedule,
): SettlementService {
  return new SettlementService(settlements, lineups, pools, matchFacts, schedule);
}
