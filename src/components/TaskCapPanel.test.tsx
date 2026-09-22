import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SKILL_CATALOGUE } from "../gameweek/catalogues.ts";
import type { LineupDraft } from "../gameweek/lineup.ts";
import { InMemoryLineupStore } from "../gameweek/lineup-store.ts";
import { PackService } from "../gameweek/pack-service.ts";
import { InMemoryPoolStore } from "../gameweek/pool-store.ts";
import { FOOTBALLER_CATALOGUE } from "../gameweek/season-catalogue.ts";
import { TaskCapService } from "../gameweek/task-cap-service.ts";
import { InMemoryTaskCapStore } from "../gameweek/task-cap-store.ts";
import { InMemoryLeagueStore } from "../league/store.ts";
import type { League } from "../league/types.ts";
import { TaskCapPanel } from "./TaskCapPanel.tsx";

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

const friendDraft: LineupDraft = {
  starters: ["Friend One"],
  bench: ["Friend Bench"],
  captain: "Friend One",
  skills: {},
};

describe("TaskCapPanel", () => {
  let taskCaps: InMemoryTaskCapStore;
  let leagues: InMemoryLeagueStore;
  let lineups: InMemoryLineupStore;
  let service: TaskCapService;
  let league: League;

  beforeEach(async () => {
    taskCaps = new InMemoryTaskCapStore();
    leagues = new InMemoryLeagueStore();
    lineups = new InMemoryLineupStore();
    const pools = new InMemoryPoolStore();
    const packs = new PackService(pools, FOOTBALLER_CATALOGUE, SKILL_CATALOGUE, rng(5));
    service = new TaskCapService(taskCaps, leagues, lineups, SCHEDULE, packs);

    league = await leagues.createLeague("兄弟联赛", "host");
    await leagues.joinLeague("friend", league.id);
    await leagues.joinLeague("friend2", league.id);
    await packs.openPacks("host", GW);
    await lineups.saveState({
      managerId: "friend",
      gameweekId: GW,
      status: "tentative",
      draft: friendDraft,
    });
  });

  function renderPanel() {
    return render(
      <TaskCapPanel
        managerId="host"
        league={league}
        gameweekId={GW}
        taskCapService={service}
        now={BEFORE}
      />,
    );
  }

  it("lists the three task cap items", async () => {
    renderPanel();

    expect(await screen.findByText("登录")).toBeInTheDocument();
    expect(screen.getByText("提交暂定阵容")).toBeInTheDocument();
    expect(screen.getByText("查看一名好友的阵容")).toBeInTheDocument();
  });

  it("marks log in on mount", async () => {
    renderPanel();

    await waitFor(async () => {
      const state = await taskCaps.getState("host", GW);
      expect(state?.tasks.loggedIn).toBe(true);
    });
  });

  it("peeks one friend's tentative Lineup and locks out the others", async () => {
    renderPanel();
    await screen.findByRole("button", { name: "查看 friend" });

    fireEvent.click(screen.getByRole("button", { name: "查看 friend" }));

    expect(await screen.findByText(/Friend One/)).toBeInTheDocument();
    expect(screen.getByText("Friend Bench")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看 friend2" })).toBeDisabled();
    expect(screen.queryByText("基础包")).not.toBeInTheDocument();
  });

  it("locks the choice to the one friend already peeked", async () => {
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "查看 friend" }));
    await screen.findByText(/Friend One/);

    expect(screen.getByRole("button", { name: "查看 friend2" })).toBeDisabled();
    expect((await service.peek("host", GW, "friend2", BEFORE)).kind).toBe(
      "already-peeked",
    );
  });

  it("shows the reward once all three tasks are done", async () => {
    await service.markTentativeLineup("host", GW, BEFORE);

    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "查看 friend" }));

    await waitFor(() =>
      expect(
        screen.getByText("本周奖励已到账：+2 球员 / +1 技能"),
      ).toBeInTheDocument(),
    );
  });
});
