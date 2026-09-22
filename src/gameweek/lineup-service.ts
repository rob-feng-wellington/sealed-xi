import { deadlineFromFirstKickoff, isPastDeadline, scheduledFirstKickoff } from "./deadline.ts";
import type { GameweekId } from "./gameweek.ts";
import { validateLineup, type LineupDraft, type LineupIssue } from "./lineup.ts";
import type { LineupState, LineupStore } from "./lineup-store.ts";
import type { SealedPoolStore } from "./pool-store.ts";

export type LineupResult =
  | { kind: "ok"; state: LineupState }
  | { kind: "invalid"; issues: readonly LineupIssue[] }
  | { kind: "past-deadline" }
  | { kind: "locked" }
  | { kind: "no-pool" };

export type KickoffSchedule = (gameweekId: GameweekId) => Date;

export class LineupService {
  constructor(
    private store: LineupStore,
    private pools: SealedPoolStore,
    private schedule: KickoffSchedule = scheduledFirstKickoff,
  ) {}

  deadline(gameweekId: GameweekId): Date {
    return deadlineFromFirstKickoff(this.schedule(gameweekId));
  }

  async getState(
    managerId: string,
    gameweekId: GameweekId,
  ): Promise<LineupState | undefined> {
    return this.store.getState(managerId, gameweekId);
  }

  async saveTentative(
    managerId: string,
    gameweekId: GameweekId,
    draft: LineupDraft,
    now: Date,
  ): Promise<LineupResult> {
    const blocked = await this.editingBlock(managerId, gameweekId, now);
    if (blocked) return blocked;
    const state: LineupState = {
      managerId,
      gameweekId,
      status: "tentative",
      draft,
    };
    await this.store.saveState(state);
    return { kind: "ok", state };
  }

  async lock(
    managerId: string,
    gameweekId: GameweekId,
    draft: LineupDraft,
    now: Date,
  ): Promise<LineupResult> {
    const blocked = await this.editingBlock(managerId, gameweekId, now);
    if (blocked) return blocked;

    const pool = await this.pools.getPool(managerId, gameweekId);
    if (!pool) return { kind: "no-pool" };

    const issues = validateLineup(draft, pool);
    if (issues.length > 0) return { kind: "invalid", issues };

    const state: LineupState = {
      managerId,
      gameweekId,
      status: "locked",
      draft,
    };
    await this.store.saveState(state);
    return { kind: "ok", state };
  }

  private async editingBlock(
    managerId: string,
    gameweekId: GameweekId,
    now: Date,
  ): Promise<LineupResult | null> {
    const deadline = this.deadline(gameweekId);
    if (isPastDeadline(now, deadline)) return { kind: "past-deadline" };
    const existing = await this.store.getState(managerId, gameweekId);
    if (existing?.status === "locked") return { kind: "locked" };
    return null;
  }
}

export function createLineupService(
  store: LineupStore,
  pools: SealedPoolStore,
  schedule?: KickoffSchedule,
): LineupService {
  return new LineupService(store, pools, schedule);
}
