import { describe, expect, it } from "vitest";
import {
  emptyTaskCap,
  isTaskCapComplete,
  TASK_CAP_ITEMS,
  TASK_CAP_REWARD,
  taskCapReward,
  type TaskCapTasks,
} from "./task-cap.ts";

const done: TaskCapTasks = {
  loggedIn: true,
  tentativeLineup: true,
  peekedManagerId: "friend",
};

describe("Task cap", () => {
  it("has exactly the three printed items and no prediction loop", () => {
    expect(TASK_CAP_ITEMS).toEqual(["login", "tentativeLineup", "peekFriend"]);
  });

  it("starts empty", () => {
    expect(emptyTaskCap("m1", "2025-W38")).toEqual({
      managerId: "m1",
      gameweekId: "2025-W38",
      tasks: { loggedIn: false, tentativeLineup: false, peekedManagerId: null },
    });
  });

  it("is complete only with all three tasks", () => {
    expect(isTaskCapComplete(done)).toBe(true);
    expect(isTaskCapComplete({ ...done, loggedIn: false })).toBe(false);
    expect(isTaskCapComplete({ ...done, tentativeLineup: false })).toBe(false);
    expect(isTaskCapComplete({ ...done, peekedManagerId: null })).toBe(false);
  });

  it("grants +2 player and +1 Skill pull only when complete", () => {
    expect(TASK_CAP_REWARD).toEqual({ player: 2, skill: 1 });
    expect(taskCapReward(done)).toEqual({ player: 2, skill: 1 });
    expect(taskCapReward({ ...done, loggedIn: false })).toEqual({
      player: 0,
      skill: 0,
    });
  });
});
