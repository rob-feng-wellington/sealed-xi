import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Rarity, SkillWager } from "../gameweek/catalogues.ts";
import type { PlayerCard } from "../gameweek/generate-packs.ts";
import { LineupService } from "../gameweek/lineup-service.ts";
import { InMemoryLineupStore } from "../gameweek/lineup-store.ts";
import type { LineupDraft } from "../gameweek/lineup.ts";
import type { SealedPool } from "../gameweek/pool.ts";
import { InMemoryPoolStore } from "../gameweek/pool-store.ts";
import type { Position } from "../gameweek/settle-match-points.ts";
import { LineupBuilder } from "./LineupBuilder.tsx";

const SPECS: readonly (readonly [string, string, Position, Rarity])[] = [
  ["GK1", "A", "GK", "rare"],
  ["DEF1", "A", "DEF", "rare"],
  ["DEF2", "B", "DEF", "rare"],
  ["DEF3", "C", "DEF", "rare"],
  ["DEF4", "D", "DEF", "rare"],
  ["MID1", "B", "MID", "rare"],
  ["MID2", "C", "MID", "rare"],
  ["MID3", "D", "MID", "rare"],
  ["MID4", "E", "MID", "rare"],
  ["FWD1", "E", "FWD", "rare"],
  ["FWD2", "F", "FWD", "rare"],
  ["BENCH1", "A", "MID", "rare"],
  ["BENCH2", "B", "DEF", "rare"],
  ["BENCH3", "C", "MID", "rare"],
  ["BENCH4", "D", "DEF", "rare"],
];

const easyShots: SkillWager = {
  band: "Easy",
  kind: "vendor",
  stat: "shotsOnTarget",
  atLeast: 1,
};
const ultraShots: SkillWager = {
  band: "Ultra",
  kind: "vendor",
  stat: "shotsOnTarget",
  atLeast: 6,
};

function makePool(): SealedPool {
  const basePack: PlayerCard[] = SPECS.map(
    ([footballerName, club, position, rarity]) => ({
      footballerName,
      club,
      position,
      rarity,
    }),
  );
  return {
    managerId: "m1",
    gameweekId: "2025-W38",
    basePack,
    skillPack: [easyShots, ultraShots],
  };
}

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
    skills: { FWD1: [easyShots, null] },
  };
}

const SCHEDULE = () => new Date("2025-09-20T12:30:00Z");
const BEFORE = new Date("2025-09-20T10:00:00Z");
const AFTER = new Date("2025-09-20T11:30:00Z");

describe("LineupBuilder", () => {
  let lineups: InMemoryLineupStore;
  let pools: InMemoryPoolStore;
  let service: LineupService;
  let pool: SealedPool;

  beforeEach(async () => {
    lineups = new InMemoryLineupStore();
    pools = new InMemoryPoolStore();
    pool = makePool();
    await pools.savePool(pool);
    service = new LineupService(lineups, pools, SCHEDULE);
  });

  function renderBuilder(now: Date = BEFORE) {
    return render(
      <LineupBuilder
        managerId="m1"
        gameweekId="2025-W38"
        pool={pool}
        lineupService={service}
        now={now}
      />,
    );
  }

  it("shows the Deadline as the first kickoff minus 90 minutes", async () => {
    renderBuilder();

    expect(await screen.findByText(/2025-09-20 11:00/)).toBeInTheDocument();
    expect(screen.getByText(/截止/)).toBeInTheDocument();
  });

  it("adds a footballer to the starters from the pool", async () => {
    renderBuilder();
    await screen.findByText(/首发 0\/11/);

    fireEvent.change(screen.getByLabelText("安排 GK1"), {
      target: { value: "starter" },
    });

    expect(screen.getByText(/首发 1\/11/)).toBeInTheDocument();
  });

  it("saves a tentative lineup and keeps it editable", async () => {
    renderBuilder();
    await screen.findByRole("button", { name: "保存草稿" });

    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => expect(screen.getByText("草稿已保存。")).toBeInTheDocument());
    const saved = await lineups.getState("m1", "2025-W38");
    expect(saved?.status).toBe("tentative");
  });

  it("restores a saved tentative lineup", async () => {
    await lineups.saveState({
      managerId: "m1",
      gameweekId: "2025-W38",
      status: "tentative",
      draft: validDraft(),
    });

    renderBuilder();

    expect(await screen.findByText(/首发 11\/11/)).toBeInTheDocument();
    expect(screen.getByText(/替补 4\/4/)).toBeInTheDocument();
  });

  it("rejects an illegal lock with the validation messages", async () => {
    const illegal = validDraft();
    illegal.bench = illegal.bench.slice(0, 3);
    await lineups.saveState({
      managerId: "m1",
      gameweekId: "2025-W38",
      status: "tentative",
      draft: illegal,
    });

    renderBuilder();
    await screen.findByText(/替补 3\/4/);
    fireEvent.click(screen.getByRole("button", { name: "锁定阵容" }));

    await waitFor(() =>
      expect(screen.getByText("替补必须是 4 人。")).toBeInTheDocument(),
    );
    expect((await lineups.getState("m1", "2025-W38"))?.status).toBe("tentative");
  });

  it("locks a legal lineup and disables further changes", async () => {
    await lineups.saveState({
      managerId: "m1",
      gameweekId: "2025-W38",
      status: "tentative",
      draft: validDraft(),
    });

    renderBuilder();
    await screen.findByText(/首发 11\/11/);
    fireEvent.click(screen.getByRole("button", { name: "锁定阵容" }));

    await waitFor(() => expect(screen.getByText("阵容已锁定。")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "锁定阵容" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "保存草稿" })).toBeDisabled();
    expect(screen.getByLabelText("安排 GK1")).toBeDisabled();
    expect((await lineups.getState("m1", "2025-W38"))?.status).toBe("locked");
  });

  it("gives the Captain two Skill slots and the bench none", async () => {
    await lineups.saveState({
      managerId: "m1",
      gameweekId: "2025-W38",
      status: "tentative",
      draft: validDraft(),
    });

    renderBuilder();
    await screen.findByText(/首发 11\/11/);

    expect(screen.getByLabelText("技能 FWD1 1")).toBeInTheDocument();
    expect(screen.getByLabelText("技能 FWD1 2")).toBeInTheDocument();
    expect(screen.getByLabelText("技能 GK1 1")).toBeInTheDocument();
    expect(screen.queryByLabelText("技能 GK1 2")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("技能 BENCH1 1")).not.toBeInTheDocument();
  });

  it("cannot change anything after the Deadline", async () => {
    await lineups.saveState({
      managerId: "m1",
      gameweekId: "2025-W38",
      status: "tentative",
      draft: validDraft(),
    });

    renderBuilder(AFTER);

    expect(await screen.findByText(/已锁定，无法修改/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "锁定阵容" })).toBeDisabled();
    expect(screen.getByLabelText("安排 GK1")).toBeDisabled();
  });
});
