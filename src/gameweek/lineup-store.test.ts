import { describe, expect, it, beforeEach } from "vitest";
import { emptyDraft } from "./lineup.ts";
import {
  InMemoryLineupStore,
  LocalStorageLineupStore,
  type LineupState,
} from "./lineup-store.ts";

function state(status: LineupState["status"]): LineupState {
  return {
    managerId: "m1",
    gameweekId: "2025-W38",
    status,
    draft: { ...emptyDraft(), starters: ["A"], captain: "A" },
  };
}

describe("InMemoryLineupStore", () => {
  it("saves and reads a lineup per manager and Gameweek", async () => {
    const store = new InMemoryLineupStore();
    await store.saveState(state("tentative"));

    expect(await store.getState("m1", "2025-W38")).toEqual(state("tentative"));
    expect(await store.getState("m2", "2025-W38")).toBeUndefined();
    expect(await store.getState("m1", "2025-W39")).toBeUndefined();
  });
});

describe("LocalStorageLineupStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists a lineup across store instances", async () => {
    const first = new LocalStorageLineupStore();
    await first.saveState(state("locked"));

    const second = new LocalStorageLineupStore();
    expect(await second.getState("m1", "2025-W38")).toEqual(state("locked"));
  });
});
