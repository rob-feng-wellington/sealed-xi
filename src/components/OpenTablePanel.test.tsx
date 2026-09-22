import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { InMemoryLineupStore } from "../gameweek/lineup-store.ts";
import { InMemoryMatchFactsStore } from "../gameweek/match-facts-store.ts";
import { InMemoryPoolStore } from "../gameweek/pool-store.ts";
import { SettlementService } from "../gameweek/settlement-service.ts";
import { InMemorySettlementStore } from "../gameweek/settlement.ts";
import { OpenTablePanel } from "./OpenTablePanel.tsx";

const GW38 = "2025-W38";
const GW39 = "2025-W39";
const emptyLineup = { starters: [], bench: [], captainIndex: -1 };

function settlement(
  managerId: string,
  gameweekId: string,
  matchPoints: number,
  skillPoints: number,
) {
  return {
    managerId,
    gameweekId,
    lineup: emptyLineup,
    slots: [],
    matchPoints,
    skillPoints,
    total: matchPoints + skillPoints,
  };
}

describe("OpenTablePanel", () => {
  let settlements: InMemorySettlementStore;
  let service: SettlementService;

  beforeEach(() => {
    settlements = new InMemorySettlementStore();
    service = new SettlementService(
      settlements,
      new InMemoryLineupStore(),
      new InMemoryPoolStore(),
      new InMemoryMatchFactsStore(),
    );
  });

  it("shows the weekly board from the settlements", async () => {
    await settlements.saveSettlement(settlement("x", GW38, 20, 0));
    await settlements.saveSettlement(settlement("y", GW38, 15, 2));

    render(<OpenTablePanel gameweekId={GW38} settlementService={service} />);

    const weekly = within((await screen.findByText("本周榜")).parentElement!);
    expect(weekly.getByText(/经理 x/)).toBeInTheDocument();
    expect(weekly.getByText("20")).toBeInTheDocument();
    expect(weekly.getByText(/经理 y/)).toBeInTheDocument();
    expect(weekly.getByText("17")).toBeInTheDocument();
  });

  it("shows a season-total board summing the same settlements", async () => {
    await settlements.saveSettlement(settlement("x", GW38, 20, 0));
    await settlements.saveSettlement(settlement("x", GW39, 5, 0));
    await settlements.saveSettlement(settlement("y", GW38, 15, 0));

    render(<OpenTablePanel gameweekId={GW38} settlementService={service} />);

    const season = within((await screen.findByText("赛季榜")).parentElement!);
    expect(season.getByText(/经理 x/)).toBeInTheDocument();
    expect(season.getByText("25")).toBeInTheDocument();
    expect(season.getByText("15")).toBeInTheDocument();
  });

  it("reads as a plaza with nothing settled yet", async () => {
    render(<OpenTablePanel gameweekId={GW38} settlementService={service} />);

    expect(await screen.findByText("广场")).toBeInTheDocument();
    expect(screen.getByText("公共看板 · 私人联赛才是主场")).toBeInTheDocument();
    expect(screen.getAllByText("暂无数据。")).toHaveLength(2);
  });
});
