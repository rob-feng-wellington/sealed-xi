import type { GameweekId } from "./gameweek.ts";

/**
 * The three Task cap items. There is no prediction loop and no ad or
 * last-Gameweek's-points source of pulls in v1.
 */
export const TASK_CAP_ITEMS = ["login", "tentativeLineup", "peekFriend"] as const;
export type TaskCapItem = (typeof TASK_CAP_ITEMS)[number];

export type TaskCapTasks = {
  loggedIn: boolean;
  tentativeLineup: boolean;
  peekedManagerId: string | null;
};

export type TaskCapState = {
  managerId: string;
  gameweekId: GameweekId;
  tasks: TaskCapTasks;
};

export const TASK_CAP_REWARD = { player: 2, skill: 1 } as const;

export type TaskCapReward = {
  player: number;
  skill: number;
};

export function emptyTaskCap(
  managerId: string,
  gameweekId: GameweekId,
): TaskCapState {
  return {
    managerId,
    gameweekId,
    tasks: { loggedIn: false, tentativeLineup: false, peekedManagerId: null },
  };
}

export function isTaskCapComplete(tasks: TaskCapTasks): boolean {
  return tasks.loggedIn && tasks.tentativeLineup && tasks.peekedManagerId !== null;
}

export function taskCapReward(tasks: TaskCapTasks): TaskCapReward {
  return isTaskCapComplete(tasks)
    ? { player: TASK_CAP_REWARD.player, skill: TASK_CAP_REWARD.skill }
    : { player: 0, skill: 0 };
}
