import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryLeagueStore } from "../league/store.ts";
import type { League } from "../league/types.ts";
import type { SkillWager } from "./catalogues.ts";
import { ingestFixture } from "./ingest.ts";
import type { LineupDraft } from "./lineup.ts";
import { InMemoryLineupStore } from "./lineup-store.ts";
import { InMemoryMatchFactsStore } from "./match-facts-store.ts";
import type { SealedPool } from "./pool.ts";
import { InMemoryPoolStore } from "./pool-store.ts";
import { SettlementService } from "./settlement-service.ts";
import { InMemorySettlementStore } from "./settlement.ts";

const GW38 = "2025-W38";
const GW39 = "2025-W39";
const AFTER_38 = new Date("2025-09-21T00:00:00Z");
const AFTER_39 = new Date("2025-09-28T00:00:00Z");
const BEFORE_38 = new Date("2025-09-20T10:00:00Z");

const easyShots: SkillWager = {
  band: "Easy",
  kind: "vendor",
  stat: "shotsOnTarget",
  atLeast: 1,
};

function pool(gameweekId: string): SealedPool {
  return {
    managerId: "a",
    gameweekId,
    basePack: [
      { footballerName: "Keeper", club: "Home", position: "GK", rarity: "rare" },
      { footballerName: "Defender", club: "Home", position: "DEF", rarity: "rare" },
      { footballerName: "Striker", club: "Home", position: "FWD", rarity: "rare" },
    ],
    skillPack: [easyShots],
  };
}

const draft: LineupDraft = {
  starters: ["Keeper", "Defender", "Striker"],
  bench: [],
  captain: "Striker",
  skills: { Striker: [easyShots] },
};

function player(
  playerName: string,
  minutes: number,
  goals: number,
  shotsOnTarget: number,
) {
  return {
    playerName,
    club: "Home",
    minutes,
    goals,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    ownGoals: 0,
    shotsOnTarget,
    keyPasses: 0,
    tackles: 0,
    interceptions: 0,
    successfulDribbles: 0,
    saves: 0,
  };
}

describe("SettlementService", () => {
  let settlements: InMemorySettlementStore;
  let lineups: InMemoryLineupStore;
  let pools: InMemoryPoolStore;
  let matchFacts: InMemoryMatchFactsStore;
  let service: SettlementService;
  let league: League;

  beforeEach(async () => {
    settlements = new InMemorySettlementStore();
    lineups = new InMemoryLineupStore();
    pools = new InMemoryPoolStore();
    matchFacts = new InMemoryMatchFactsStore();
    service = new SettlementService(settlements, lineups, pools, matchFacts);

    const store = new InMemoryLeagueStore();
    league = await store.createLeague("兄弟联赛", "a");
    await store.joinLeague("b", league.id);

    await pools.savePool(pool(GW38));
    await lineups.saveState({
      managerId: "a",
      gameweekId: GW38,
      status: "locked",
      draft,
    });

    await matchFacts.saveFixture(
      ingestFixture({
        gameweekId: GW38,
        homeClub: "Home",
        awayClub: "Away",
        homeGoals: 1,
        awayGoals: 0,
        kickoff: "2025-09-20T12:30:00.000Z",
        players: [
          player("Keeper", 90, 0, 0),
          player("Defender", 90, 0, 0),
          player("Striker", 90, 1, 2),
        ],
      }),
    );
  });

  it("refuses to settle before the Deadline (no live in-play scoring)", async () => {
    const result = await service.settleLeague(league, GW38, BEFORE_38);

    expect(result.kind).toBe("too-early");
    expect(await settlements.getGameweekSettlements(GW38)).toHaveLength(0);
  });

  it("settles each manager's totals from the domain seam", async () => {
    const result = await service.settleLeague(league, GW38, AFTER_38);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    const a = result.settlements.find((s) => s.managerId === "a")!;
    const b = result.settlements.find((s) => s.managerId === "b")!;

    expect(a.matchPoints).toBe(16); // appearance + clean sheets + goal
    expect(a.skillPoints).toBe(2); // Easy shots on target hit
    expect(a.total).toBe(18);
    expect(a.slots).toHaveLength(3);
    expect(b.total).toBe(0);
  });

  it("reports a season total of the Gameweek scores", async () => {
    await service.settleLeague(league, GW38, AFTER_38);

    expect(await service.seasonTotal("a")).toBe(18);
  });

  it("builds a Private league Gameweek table with season totals", async () => {
    await service.settleLeague(league, GW38, AFTER_38);
    const table = await service.leagueTable(league, GW38);

    expect(table).toEqual([
      { managerId: "a", gameweekPoints: 18, seasonPoints: 18 },
      { managerId: "b", gameweekPoints: 0, seasonPoints: 0 },
    ]);
  });

  it("adds a second Gameweek to the season total", async () => {
    await service.settleLeague(league, GW38, AFTER_38);

    await pools.savePool(pool(GW39));
    await lineups.saveState({
      managerId: "a",
      gameweekId: GW39,
      status: "locked",
      draft,
    });
    await matchFacts.saveFixture(
      ingestFixture({
        gameweekId: GW39,
        homeClub: "Home",
        awayClub: "Away",
        homeGoals: 0,
        awayGoals: 0,
        kickoff: "2025-09-27T12:30:00.000Z",
        players: [
          player("Keeper", 90, 0, 0),
          player("Defender", 90, 0, 0),
          player("Striker", 0, 0, 0),
        ],
      }),
    );

    await service.settleLeague(league, GW39, AFTER_39);

    // GW39: Keeper 5 + Defender 5 + Striker's worn skill misses -1 = 9.
    expect(await service.seasonTotal("a")).toBe(27);
  });

  it("is idempotent when a Gameweek is settled twice", async () => {
    await service.settleLeague(league, GW38, AFTER_38);
    await service.settleLeague(league, GW38, AFTER_38);

    expect(await service.seasonTotal("a")).toBe(18);
    expect(await settlements.getGameweekSettlements(GW38)).toHaveLength(2);
  });
});
