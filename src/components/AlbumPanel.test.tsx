import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlbumService } from "../gameweek/album-service.ts";
import { InMemoryAlbumStore } from "../gameweek/album-store.ts";
import { CLUB_SETS } from "../gameweek/season-catalogue.ts";
import { AlbumPanel } from "./AlbumPanel.tsx";

const arsenal = CLUB_SETS.find((set) => set.club === "Arsenal")!;

function names(count: number) {
  return arsenal.footballerNames
    .slice(0, count)
    .map((footballerName) => ({ footballerName }));
}

describe("AlbumPanel", () => {
  it("shows a completed Club set and the next Gameweek pull", async () => {
    const service = new AlbumService(new InMemoryAlbumStore());
    await service.recordDraw("m1", "2025-W38", names(11));

    render(<AlbumPanel managerId="m1" albumService={service} />);

    expect(await screen.findByText("已收集印记 11 个")).toBeInTheDocument();
    expect(screen.getByText("Arsenal")).toBeInTheDocument();
    expect(screen.getByText(/11\/11/)).toBeInTheDocument();
    expect(
      screen.getByText("下一周（2025-W39）额外 +1 球员抽"),
    ).toBeInTheDocument();
  });

  it("shows partial Club set progress", async () => {
    const service = new AlbumService(new InMemoryAlbumStore());
    await service.recordDraw("m1", "2025-W38", names(3));

    render(<AlbumPanel managerId="m1" albumService={service} />);

    expect(await screen.findByText("已收集印记 3 个")).toBeInTheDocument();
    expect(screen.getByText(/3\/11/)).toBeInTheDocument();
  });
});
