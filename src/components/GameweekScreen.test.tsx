import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SKILL_CATALOGUE } from "../gameweek/catalogues.ts";
import { LineupService } from "../gameweek/lineup-service.ts";
import { InMemoryLineupStore } from "../gameweek/lineup-store.ts";
import { PackService } from "../gameweek/pack-service.ts";
import { InMemoryPoolStore } from "../gameweek/pool-store.ts";
import { FOOTBALLER_CATALOGUE } from "../gameweek/season-catalogue.ts";
import { GameweekScreen } from "./GameweekScreen.tsx";

const SCHEDULE = () => new Date("2025-09-20T12:30:00Z");
const BEFORE = new Date("2025-09-20T10:00:00Z");

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("GameweekScreen", () => {
  let store: InMemoryPoolStore;
  let service: PackService;
  let lineupService: LineupService;

  beforeEach(() => {
    store = new InMemoryPoolStore();
    service = new PackService(store, FOOTBALLER_CATALOGUE, SKILL_CATALOGUE, rng(3));
    lineupService = new LineupService(new InMemoryLineupStore(), store, SCHEDULE);
  });

  function renderScreen(gameweekId = "2025-W38") {
    return render(
      <GameweekScreen
        managerId="m1"
        gameweekId={gameweekId}
        packService={service}
        lineupService={lineupService}
        now={BEFORE}
      />,
    );
  }

  it("offers to open this Gameweek's packs before they exist", async () => {
    renderScreen();

    expect(
      await screen.findByRole("button", { name: "开启本周卡包" }),
    ).toBeInTheDocument();
  });

  it("opens the Base pack and Skill pack and reads them as written names", async () => {
    const { container } = renderScreen();

    fireEvent.click(await screen.findByRole("button", { name: "开启本周卡包" }));

    expect(await screen.findByText("基础包 · 24 张")).toBeInTheDocument();
    expect(screen.getByText("技能包 · 14 张")).toBeInTheDocument();

    const pool = await service.getPool("m1", "2025-W38");
    expect(pool).toBeDefined();
    expect(screen.getAllByText(pool!.basePack[0]!.footballerName).length).toBeGreaterThan(0);
    expect(screen.getAllByText(pool!.basePack[0]!.club).length).toBeGreaterThan(0);
    expect(screen.getAllByText("门将").length).toBeGreaterThan(0);

    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.textContent).not.toMatch(/Premier League|FPL/);
  });

  it("restores an already-opened pool on mount", async () => {
    await service.openPacks("m1", "2025-W38");

    const { container } = renderScreen();

    expect(await screen.findByText("基础包 · 24 张")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "开启本周卡包" }),
    ).not.toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("opens a fresh pool for the next Gameweek", async () => {
    const first = await service.openPacks("m1", "2025-W38");

    renderScreen("2025-W39");

    fireEvent.click(await screen.findByRole("button", { name: "开启本周卡包" }));

    await waitFor(async () => {
      expect(await service.getPool("m1", "2025-W39")).toBeDefined();
    });
    const second = await service.getPool("m1", "2025-W39");
    expect(second!.basePack).not.toEqual(first.basePack);
  });
});
