import { describe, expect, it, beforeEach } from "vitest";
import { emptyTaskCap } from "./task-cap.ts";
import {
  InMemoryTaskCapStore,
  LocalStorageTaskCapStore,
} from "./task-cap-store.ts";

function state(loggedIn: boolean) {
  const base = emptyTaskCap("m1", "2025-W38");
  return { ...base, tasks: { ...base.tasks, loggedIn } };
}

describe("InMemoryTaskCapStore", () => {
  it("saves and reads per manager and Gameweek", async () => {
    const store = new InMemoryTaskCapStore();
    await store.saveState(state(true));

    expect(await store.getState("m1", "2025-W38")).toEqual(state(true));
    expect(await store.getState("m1", "2025-W39")).toBeUndefined();
    expect(await store.getState("m2", "2025-W38")).toBeUndefined();
  });
});

describe("LocalStorageTaskCapStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists across store instances", async () => {
    const first = new LocalStorageTaskCapStore();
    await first.saveState(state(true));

    const second = new LocalStorageTaskCapStore();
    expect(await second.getState("m1", "2025-W38")).toEqual(state(true));
  });
});
