import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SkillWager } from "../gameweek/catalogues.ts";
import { ingestFixture } from "../gameweek/ingest.ts";
import type { LineupDraft } from "../gameweek/lineup.ts";
import { InMemoryLineupStore } from "../gameweek/lineup-store.ts";
import { InMemoryMatchFactsStore } from "../gameweek/match-facts-store.ts";
import type { SealedPool } from "../gameweek/pool.ts";
import { InMemoryPoolStore } from "../gameweek/pool-store.ts";
import { SettlementService } from "../gameweek/settlement-service.ts";
import { InMemorySettlementStore } from "../gameweek/settlement.ts";
import { InMemoryLeagueStore } from "../league/store.ts";
import type { League } from "../league/types.ts";
import { RevealPanel } from "./RevealPanel.tsx";

const GW = "2025-W38";
const BEFORE = new Date("2025-09-20T10:00:00Z");
const AFTER = new Date("2025-09-21T00:00:00Z");

const easyShots: SkillWager = {
  band: "Easy",
  kind: "vendor",
  stat: "shotsOnTarget",
  atLeast: 1,
};

const pool: SealedPool = {
  managerId: "a",
  gameweekId: GW,
  basePack: [
    { footballerName: "Keeper", club: "Home", position: "GK", rarity: "rare" },
    { footballerName: "Defender", club: "Home", position: "DEF", rarity: "rare" },
    { footballerName: "Striker", club: "Home", position: "FWD", rarity: "rare" },
  ],
  skillPack: [easyShots],
};

const draft: LineupDraft = {
  starters: ["Keeper", "Defender", "Striker"],
  bench: [],
  captain: "Striker",
  skills: { Striker: [easyShots] },
};

function player(playerName: string, goals: number, shotsOnTarget: number) {
  return {
    playerName,
    club: "Home",
    minutes: 90,
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

describe("RevealPanel", () => {
  let service: SettlementService;
  let league: League;

  beforeEach(async () => {
    const settlements = new InMemorySettlementStore();
    const lineups = new InMemoryLineupStore();
    const pools = new InMemoryPoolStore();
    const matchFacts = new InMemoryMatchFactsStore();
    service = new SettlementService(settlements, lineups, pools, matchFacts);

    const leagues = new InMemoryLeagueStore();
    league = await leagues.createLeague("兄弟联赛", "a");
    await leagues.joinLeague("b", league.id);

    await pools.savePool(pool);
    await lineups.saveState({
      managerId: "a",
      gameweekId: GW,
      status: "locked",
      draft,
    });
    await matchFacts.saveFixture(
      ingestFixture({
        gameweekId: GW,
        homeClub: "Home",
        awayClub: "Away",
        homeGoals: 1,
        awayGoals: 0,
        kickoff: "2025-09-20T12:30:00.000Z",
        players: [
          player("Keeper", 0, 0),
          player("Defender", 0, 0),
          player("Striker", 1, 2),
        ],
      }),
    );
  });

  function renderPanel(now: Date) {
    return render(
      <RevealPanel
        league={league}
        gameweekId={GW}
        settlementService={service}
        now={now}
      />,
    );
  }

  it("hides the Lineups and scores before the Deadline", () => {
    renderPanel(BEFORE);

    expect(
      screen.getByText("锁阵后揭晓本联赛的阵容与比分。"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keeper")).not.toBeInTheDocument();
  });

  it("reveals locked Lineups, worn Skills, and per-manager totals", async () => {
    renderPanel(AFTER);

    expect(await screen.findByText("好友 a · 本周 18 分")).toBeInTheDocument();
    expect(screen.getByText("Keeper")).toBeInTheDocument();
    expect(screen.getByText(/Striker/)).toBeInTheDocument();
    expect(screen.getByText(/简单 · 射正 ≥ 1/)).toBeInTheDocument();
  });

  it("shows a Gameweek table with season totals", async () => {
    renderPanel(AFTER);

    expect(await screen.findByText("本周")).toBeInTheDocument();
    expect(screen.getByText("赛季")).toBeInTheDocument();
    const row = screen.getByText("好友 a").closest("tr")!;
    expect(row).toHaveTextContent("18");
  });
});
