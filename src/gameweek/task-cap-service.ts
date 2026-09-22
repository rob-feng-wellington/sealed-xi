import type { LeagueStore } from "../league/types.js";
import {
  deadlineFromFirstKickoff,
  isPastDeadline,
  scheduledFirstKickoff,
} from "./deadline.ts";
import type { GameweekId } from "./gameweek.ts";
import type { LineupDraft } from "./lineup.ts";
import type { LineupStore } from "./lineup-store.ts";
import type { KickoffSchedule } from "./lineup-service.ts";
import type { PackService } from "./pack-service.ts";
import type { TaskCapStore } from "./task-cap-store.ts";
import {
  emptyTaskCap,
  isTaskCapComplete,
  TASK_CAP_REWARD,
  type TaskCapState,
  type TaskCapTasks,
} from "./task-cap.ts";

export type TaskCapResult =
  | { kind: "ok"; state: TaskCapState }
  | { kind: "past-deadline" };

export type PeekResult =
  | { kind: "ok"; state: TaskCapState; friendId: string; draft: LineupDraft | null }
  | { kind: "past-deadline" }
  | { kind: "self" }
  | { kind: "not-in-league" }
  | { kind: "already-peeked"; friendId: string };

export class TaskCapService {
  constructor(
    private store: TaskCapStore,
    private leagues: LeagueStore,
    private lineups: LineupStore,
    private schedule: KickoffSchedule = scheduledFirstKickoff,
    private packs?: PackService,
  ) {}

  deadline(gameweekId: GameweekId): Date {
    return deadlineFromFirstKickoff(this.schedule(gameweekId));
  }

  async getState(managerId: string, gameweekId: GameweekId): Promise<TaskCapState> {
    return (
      (await this.store.getState(managerId, gameweekId)) ??
      emptyTaskCap(managerId, gameweekId)
    );
  }

  async markLoggedIn(
    managerId: string,
    gameweekId: GameweekId,
    now: Date,
  ): Promise<TaskCapResult> {
    return this.update(managerId, gameweekId, now, (tasks) => ({
      ...tasks,
      loggedIn: true,
    }));
  }

  async markTentativeLineup(
    managerId: string,
    gameweekId: GameweekId,
    now: Date,
  ): Promise<TaskCapResult> {
    return this.update(managerId, gameweekId, now, (tasks) => ({
      ...tasks,
      tentativeLineup: true,
    }));
  }

  /**
   * Peek exactly one Private league friend's tentative Lineup before the
   * Deadline. Once one friend is peeked, another cannot be chosen.
   */
  async peek(
    managerId: string,
    gameweekId: GameweekId,
    friendId: string,
    now: Date,
  ): Promise<PeekResult> {
    if (isPastDeadline(now, this.deadline(gameweekId))) {
      return { kind: "past-deadline" };
    }
    if (friendId === managerId) {
      return { kind: "self" };
    }
    const league = await this.leagues.getLeagueForManager(managerId);
    if (!league || !league.memberIds.includes(friendId)) {
      return { kind: "not-in-league" };
    }
    const current = await this.getState(managerId, gameweekId);
    const peeked = current.tasks.peekedManagerId;
    if (peeked !== null && peeked !== friendId) {
      return { kind: "already-peeked", friendId: peeked };
    }
    const state: TaskCapState = {
      ...current,
      tasks: { ...current.tasks, peekedManagerId: friendId },
    };
    await this.store.saveState(state);
    await this.applyReward(state);
    const friendLineup = await this.lineups.getState(friendId, gameweekId);
    return { kind: "ok", state, friendId, draft: friendLineup?.draft ?? null };
  }

  /** Re-apply the Task cap reward if the pool opened after the tasks finished. */
  async ensureReward(managerId: string, gameweekId: GameweekId): Promise<void> {
    await this.applyReward(await this.getState(managerId, gameweekId));
  }

  private async update(
    managerId: string,
    gameweekId: GameweekId,
    now: Date,
    change: (tasks: TaskCapTasks) => TaskCapTasks,
  ): Promise<TaskCapResult> {
    if (isPastDeadline(now, this.deadline(gameweekId))) {
      return { kind: "past-deadline" };
    }
    const current = await this.getState(managerId, gameweekId);
    const state: TaskCapState = { ...current, tasks: change(current.tasks) };
    await this.store.saveState(state);
    await this.applyReward(state);
    return { kind: "ok", state };
  }

  private async applyReward(state: TaskCapState): Promise<void> {
    if (!this.packs || !isTaskCapComplete(state.tasks)) {
      return;
    }
    await this.packs.grantBonusPulls(
      state.managerId,
      state.gameweekId,
      TASK_CAP_REWARD.player,
      TASK_CAP_REWARD.skill,
    );
  }
}

export function createTaskCapService(
  store: TaskCapStore,
  leagues: LeagueStore,
  lineups: LineupStore,
  schedule?: KickoffSchedule,
  packs?: PackService,
): TaskCapService {
  return new TaskCapService(store, leagues, lineups, schedule, packs);
}
