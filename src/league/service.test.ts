import { describe, it, expect, beforeEach } from "vitest";
import {
  createLeagueService,
  LeagueService,
  validateJoinCode,
  validateLeagueName,
} from "./service.js";
import { InMemoryLeagueStore, LocalStorageLeagueStore } from "./store.js";

describe("LeagueService", () => {
  let store: InMemoryLeagueStore;
  let service: LeagueService;

  beforeEach(() => {
    store = new InMemoryLeagueStore();
    service = createLeagueService(store);
  });

  it("creates a league for a new manager", async () => {
    const result = await service.createLeague("兄弟联赛", "manager-1");

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.league.name).toBe("兄弟联赛");
    expect(result.league.hostId).toBe("manager-1");
    expect(result.league.memberIds).toContain("manager-1");
    expect(result.league.joinCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("rejects an empty league name", async () => {
    const result = await service.createLeague("   ", "manager-1");

    expect(result.kind).toBe("invalid-name");
  });

  it("rejects creating a second league for the same manager", async () => {
    await service.createLeague("兄弟联赛", "manager-1");
    const result = await service.createLeague("第二个联赛", "manager-1");

    expect(result.kind).toBe("already-member");
  });

  it("lets a manager join with a join code", async () => {
    const created = await service.createLeague("兄弟联赛", "host");
    if (created.kind !== "ok") return;

    const result = await service.joinLeague("guest", created.league.joinCode);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.league.memberIds).toContain("guest");
  });

  it("rejects an invalid join code format", async () => {
    const result = await service.joinLeague("guest", "short");

    expect(result.kind).toBe("invalid-code");
  });

  it("rejects a join code that does not exist", async () => {
    const result = await service.joinLeague("guest", "ZZZZZZ");

    expect(result.kind).toBe("not-found");
  });

  it("rejects joining when the manager already belongs to a league", async () => {
    const created = await service.createLeague("兄弟联赛", "host");
    if (created.kind !== "ok") return;
    await service.joinLeague("guest", created.league.joinCode);

    const result = await service.joinLeague("guest", created.league.joinCode);

    expect(result.kind).toBe("already-member");
  });

  it("looks up a manager's league", async () => {
    const created = await service.createLeague("兄弟联赛", "manager-1");
    if (created.kind !== "ok") return;

    const league = await service.getLeagueForManager("manager-1");

    expect(league).toEqual(created.league);
  });
});

describe("LocalStorageLeagueStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists a league across store instances", async () => {
    const first = new LocalStorageLeagueStore();
    const league = await first.createLeague("兄弟联赛", "manager-1");

    const second = new LocalStorageLeagueStore();
    const found = await second.getLeagueByCode(league.joinCode);

    expect(found).toEqual(league);
  });

  it("persists membership across store instances", async () => {
    const first = new LocalStorageLeagueStore();
    const league = await first.createLeague("兄弟联赛", "manager-1");
    await first.joinLeague("manager-2", league.id);

    const second = new LocalStorageLeagueStore();
    const memberLeague = await second.getLeagueForManager("manager-2");

    expect(memberLeague?.id).toBe(league.id);
  });
});

describe("validateLeagueName", () => {
  it("accepts names between 2 and 30 characters", () => {
    expect(validateLeagueName("兄弟联赛")).toBe(true);
    expect(validateLeagueName("a league name")).toBe(true);
  });

  it("rejects empty or too-long names", () => {
    expect(validateLeagueName("")).toBe(false);
    expect(validateLeagueName("  ")).toBe(false);
    expect(validateLeagueName("a".repeat(31))).toBe(false);
  });
});

describe("validateJoinCode", () => {
  it("accepts a 6-character alphanumeric code", () => {
    expect(validateJoinCode("ABC123")).toBe(true);
    expect(validateJoinCode("abc123")).toBe(true);
  });

  it("rejects short or non-alphanumeric codes", () => {
    expect(validateJoinCode("ABC12")).toBe(false);
    expect(validateJoinCode("ABC-23")).toBe(false);
  });
});
