import { describe, expect, it, beforeEach } from "vitest";
import { AlbumService } from "./album-service.ts";
import { InMemoryAlbumStore } from "./album-store.ts";
import { SKILL_CATALOGUE } from "./catalogues.ts";
import { PackService } from "./pack-service.ts";
import { InMemoryPoolStore } from "./pool-store.ts";
import { CLUB_SETS, FOOTBALLER_CATALOGUE } from "./season-catalogue.ts";

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const GW38 = "2025-W38";
const GW39 = "2025-W39";
const arsenal = CLUB_SETS.find((set) => set.club === "Arsenal")!;
const city = CLUB_SETS.find((set) => set.club === "Manchester City")!;

function names(clubSet: { footballerNames: readonly string[] }) {
  return clubSet.footballerNames.map((footballerName) => ({ footballerName }));
}

describe("AlbumService", () => {
  let store: InMemoryAlbumStore;
  let service: AlbumService;

  beforeEach(() => {
    store = new InMemoryAlbumStore();
    service = new AlbumService(store);
  });

  it("stamps each unique footballer once", async () => {
    const first = await service.recordDraw("m1", GW38, [
      { footballerName: "A" },
      { footballerName: "B" },
    ]);
    const second = await service.recordDraw("m1", GW38, [
      { footballerName: "B" },
      { footballerName: "C" },
    ]);

    expect(first.newStamps).toEqual(["A", "B"]);
    expect(second.newStamps).toEqual(["C"]);
    expect(second.state.stamps).toEqual(["A", "B", "C"]);
  });

  it("schedules a +1 player pull for the following Gameweek on completion", async () => {
    const draw = await service.recordDraw("m1", GW38, names(arsenal));

    expect(draw.completedNow).toEqual(["Arsenal"]);
    expect(draw.albumPullFor).toBe(GW39);
    expect(await service.pullForGameweek("m1", GW39)).toBe(1);
  });

  it("never grants the pull in the Gameweek the set was completed", async () => {
    await service.recordDraw("m1", GW38, names(arsenal));

    expect(await service.pullForGameweek("m1", GW38)).toBe(0);
  });

  it("caps the pull at one per Gameweek even across multiple sets", async () => {
    const draw = await service.recordDraw("m1", GW38, [
      ...names(arsenal),
      ...names(city),
    ]);

    expect(draw.completedNow).toEqual(["Arsenal", "Manchester City"]);
    expect(await service.pullForGameweek("m1", GW39)).toBe(1);
  });

  it("consumes the pull when the next Gameweek is claimed", async () => {
    await service.recordDraw("m1", GW38, names(arsenal));

    expect(await service.pullForGameweek("m1", GW39)).toBe(1);
    await service.markPullGranted("m1", GW39);

    expect(await service.pullForGameweek("m1", GW39)).toBe(0);
    expect(await service.pullForGameweek("m1", "2025-W40")).toBe(0);
  });

  it("applies the pull to the next Gameweek's pack only", async () => {
    const pools = new InMemoryPoolStore();
    const packs = new PackService(
      pools,
      FOOTBALLER_CATALOGUE,
      SKILL_CATALOGUE,
      rng(3),
    );
    await service.recordDraw("m1", GW38, names(arsenal));

    const sameWeek = await service.openGameweekPacks("m1", GW38, packs);
    expect(sameWeek.basePack).toHaveLength(24);

    const next = await service.openGameweekPacks("m1", GW39, packs);
    expect(next.basePack).toHaveLength(25);
    expect(next.skillPack).toHaveLength(14); // Album never adds a Skill pull
    expect(next.albumPulls).toBe(1);
    expect(await service.pullForGameweek("m1", GW39)).toBe(0);
  });

  it("does not double-spend the pull on a refresh", async () => {
    const pools = new InMemoryPoolStore();
    const packs = new PackService(
      pools,
      FOOTBALLER_CATALOGUE,
      SKILL_CATALOGUE,
      rng(4),
    );
    await service.recordDraw("m1", GW38, names(arsenal));

    const first = await service.openGameweekPacks("m1", GW39, packs);
    const again = await service.openGameweekPacks("m1", GW39, packs);

    expect(first.basePack).toHaveLength(25);
    expect(again.basePack).toHaveLength(25);
    expect(again).toEqual(first);
  });
});
