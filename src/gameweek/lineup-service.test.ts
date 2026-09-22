import { describe, expect, it, beforeEach } from "vitest";
import type { Rarity } from "./catalogues.ts";
import type { PlayerCard } from "./generate-packs.ts";
import { LineupService } from "./lineup-service.ts";
import { InMemoryLineupStore } from "./lineup-store.ts";
import { emptyDraft, type LineupDraft } from "./lineup.ts";
import type { SealedPool } from "./pool.ts";
import { InMemoryPoolStore } from "./pool-store.ts";
import type { Position } from "./settle-match-points.ts";

const POOL: SealedPool = {
  managerId: "m1",
  gameweekId: "2025-W38",
  basePack: [
    ["GK1", "A", "GK"],
    ["DEF1", "A", "DEF"],
    ["DEF2", "B", "DEF"],
    ["DEF3", "C", "DEF"],
    ["DEF4", "D", "DEF"],
    ["MID1", "B", "MID"],
    ["MID2", "C", "MID"],
    ["MID3", "D", "MID"],
    ["MID4", "E", "MID"],
    ["FWD1", "E", "FWD"],
    ["FWD2", "F", "FWD"],
    ["BENCH1", "A", "MID"],
    ["BENCH2", "B", "DEF"],
    ["BENCH3", "C", "MID"],
    ["BENCH4", "D", "DEF"],
  ].map(([footballerName, club, position]) => ({
    footballerName,
    club,
    position: position as Position,
    rarity: "rare" as Rarity,
  })) satisfies PlayerCard[],
  skillPack: [],
};

function validDraft(): LineupDraft {
  return {
    starters: [
      "GK1",
      "DEF1",
      "DEF2",
      "DEF3",
      "DEF4",
      "MID1",
      "MID2",
      "MID3",
      "MID4",
      "FWD1",
      "FWD2",
    ],
    bench: ["BENCH1", "BENCH2", "BENCH3", "BENCH4"],
    captain: "FWD1",
    skills: {},
  };
}

const SCHEDULE = () => new Date("2025-09-20T12:30:00Z");
const BEFORE = new Date("2025-09-20T10:00:00Z");
const AFTER = new Date("2025-09-20T11:00:00Z");

describe("LineupService", () => {
  let lineups: InMemoryLineupStore;
  let pools: InMemoryPoolStore;
  let service: LineupService;

  beforeEach(async () => {
    lineups = new InMemoryLineupStore();
    pools = new InMemoryPoolStore();
    await pools.savePool(POOL);
    service = new LineupService(lineups, pools, SCHEDULE);
  });

  it("computes the Deadline from the Gameweek's first kickoff", () => {
    expect(service.deadline("2025-W38").toISOString()).toBe(
      "2025-09-20T11:00:00.000Z",
    );
  });

  it("saves a tentative lineup before the Deadline", async () => {
    const result = await service.saveTentative("m1", "2025-W38", validDraft(), BEFORE);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.state.status).toBe("tentative");
    expect(await service.getState("m1", "2025-W38")).toEqual(result.state);
  });

  it("edits a tentative lineup until the Deadline", async () => {
    const first = await service.saveTentative("m1", "2025-W38", emptyDraft(), BEFORE);
    expect(first.kind).toBe("ok");

    const second = await service.saveTentative("m1", "2025-W38", validDraft(), BEFORE);

    expect(second.kind).toBe("ok");
    if (second.kind !== "ok") return;
    expect(second.state.draft.starters).toHaveLength(11);
  });

  it("locks a legal lineup", async () => {
    const result = await service.lock("m1", "2025-W38", validDraft(), BEFORE);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.state.status).toBe("locked");
  });

  it("rejects an illegal lock with issues", async () => {
    const illegal = validDraft();
    illegal.bench = illegal.bench.slice(0, 3);

    const result = await service.lock("m1", "2025-W38", illegal, BEFORE);

    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.issues).toContain("wrong-bench-count");
    expect(await service.getState("m1", "2025-W38")).toBeUndefined();
  });

  it("refuses to change anything after the Deadline", async () => {
    const tentative = await service.saveTentative("m1", "2025-W38", validDraft(), BEFORE);
    expect(tentative.kind).toBe("ok");

    expect((await service.saveTentative("m1", "2025-W38", emptyDraft(), AFTER)).kind).toBe(
      "past-deadline",
    );
    expect((await service.lock("m1", "2025-W38", validDraft(), AFTER)).kind).toBe(
      "past-deadline",
    );
  });

  it("refuses to change a locked lineup before the Deadline", async () => {
    const locked = await service.lock("m1", "2025-W38", validDraft(), BEFORE);
    expect(locked.kind).toBe("ok");

    expect((await service.saveTentative("m1", "2025-W38", emptyDraft(), BEFORE)).kind).toBe(
      "locked",
    );
    expect((await service.lock("m1", "2025-W38", validDraft(), BEFORE)).kind).toBe("locked");
  });

  it("cannot lock without an opened pool", async () => {
    const result = await service.lock("m2", "2025-W38", validDraft(), BEFORE);

    expect(result.kind).toBe("no-pool");
  });
});
