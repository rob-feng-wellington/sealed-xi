import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryLeagueStore } from "../league/store.ts";
import { SKILL_CATALOGUE } from "./catalogues.ts";
import type { LineupDraft } from "./lineup.ts";
import { InMemoryLineupStore } from "./lineup-store.ts";
import { PackService } from "./pack-service.ts";
import { InMemoryPoolStore } from "./pool-store.ts";
import { FOOTBALLER_CATALOGUE } from "./season-catalogue.ts";
import { TaskCapService } from "./task-cap-service.ts";
import { InMemoryTaskCapStore } from "./task-cap-store.ts";

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const GW = "2025-W38";
const SCHEDULE = () => new Date("2025-09-20T12:30:00Z");
const BEFORE = new Date("2025-09-20T10:00:00Z");
const AFTER = new Date("2025-09-20T11:30:00Z");

const friendDraft: LineupDraft = {
  starters: ["A"],
  bench: [],
  captain: "A",
  skills: {},
};

describe("TaskCapService", () => {
  let taskCap: InMemoryTaskCapStore;
  let leagues: InMemoryLeagueStore;
  let lineups: InMemoryLineupStore;
  let pools: InMemoryPoolStore;
  let packs: PackService;
  let service: TaskCapService;
  let leagueId: string;

  beforeEach(async () => {
    taskCap = new InMemoryTaskCapStore();
    leagues = new InMemoryLeagueStore();
    lineups = new InMemoryLineupStore();
    pools = new InMemoryPoolStore();
    packs = new PackService(pools, FOOTBALLER_CATALOGUE, SKILL_CATALOGUE, rng(5));
    service = new TaskCapService(taskCap, leagues, lineups, SCHEDULE, packs);

    const league = await leagues.createLeague("兄弟联赛", "host");
    leagueId = league.id;
    await leagues.joinLeague("friend", leagueId);
    await leagues.joinLeague("friend2", leagueId);
    await packs.openPacks("host", GW);
    await lineups.saveState({
      managerId: "friend",
      gameweekId: GW,
      status: "tentative",
      draft: friendDraft,
    });
  });

  it("computes the Deadline from the first kickoff", () => {
    expect(service.deadline(GW).toISOString()).toBe("2025-09-20T11:00:00.000Z");
  });

  it("marks log in and tentative Lineup", async () => {
    const loggedIn = await service.markLoggedIn("host", GW, BEFORE);
    expect(loggedIn.kind).toBe("ok");
    const tentative = await service.markTentativeLineup("host", GW, BEFORE);

    expect(tentative.kind).toBe("ok");
    if (tentative.kind !== "ok") return;
    expect(tentative.state.tasks).toMatchObject({
      loggedIn: true,
      tentativeLineup: true,
    });
  });

  it("peeks one league friend's tentative Lineup", async () => {
    const result = await service.peek("host", GW, "friend", BEFORE);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.friendId).toBe("friend");
    expect(result.draft).toEqual(friendDraft);
    expect(result.state.tasks.peekedManagerId).toBe("friend");
  });

  it("refuses to peek yourself or someone outside the league", async () => {
    expect((await service.peek("host", GW, "host", BEFORE)).kind).toBe("self");
    expect((await service.peek("host", GW, "stranger", BEFORE)).kind).toBe(
      "not-in-league",
    );
  });

  it("allows only one friend to be peeked", async () => {
    await service.peek("host", GW, "friend", BEFORE);
    const second = await service.peek("host", GW, "friend2", BEFORE);

    expect(second.kind).toBe("already-peeked");
    if (second.kind !== "already-peeked") return;
    expect(second.friendId).toBe("friend");
  });

  it("grants +2 player and +1 Skill pull when all three tasks are done", async () => {
    await service.markLoggedIn("host", GW, BEFORE);
    await service.markTentativeLineup("host", GW, BEFORE);
    const peeked = await service.peek("host", GW, "friend", BEFORE);
    expect(peeked.kind).toBe("ok");

    const pool = await packs.getPool("host", GW);
    expect(pool!.basePack).toHaveLength(26);
    expect(pool!.skillPack).toHaveLength(15);
    expect(pool!.bonusPulls).toEqual({ player: 2, skill: 1 });
  });

  it("does not stack the reward when tasks are re-marked", async () => {
    await service.markLoggedIn("host", GW, BEFORE);
    await service.markTentativeLineup("host", GW, BEFORE);
    await service.peek("host", GW, "friend", BEFORE);
    await service.markLoggedIn("host", GW, BEFORE);
    await service.ensureReward("host", GW);

    const pool = await packs.getPool("host", GW);
    expect(pool!.basePack).toHaveLength(26);
    expect(pool!.skillPack).toHaveLength(15);
  });

  it("keeps the reward inside this Gameweek only", async () => {
    await service.markLoggedIn("host", GW, BEFORE);
    await service.markTentativeLineup("host", GW, BEFORE);
    await service.peek("host", GW, "friend", BEFORE);

    const next = await packs.openPacks("host", "2025-W39");
    expect(next.basePack).toHaveLength(24);
    expect(next.bonusPulls).toBeUndefined();
  });

  it("performs no task after the Deadline", async () => {
    expect((await service.markLoggedIn("host", GW, AFTER)).kind).toBe(
      "past-deadline",
    );
    expect((await service.markTentativeLineup("host", GW, AFTER)).kind).toBe(
      "past-deadline",
    );
    expect((await service.peek("host", GW, "friend", AFTER)).kind).toBe(
      "past-deadline",
    );
  });
});
