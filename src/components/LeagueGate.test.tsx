import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LeagueGate } from "./LeagueGate.js";
import type { LeagueResult } from "../league/types.js";

describe("LeagueGate", () => {
  it("creates a league", async () => {
    const onCreate = vi.fn(async (): Promise<LeagueResult> => ({
      kind: "ok",
      league: {
        id: "1",
        name: "兄弟联赛",
        joinCode: "ABC123",
        hostId: "m1",
        memberIds: ["m1"],
      },
    }));
    const onJoin = vi.fn(async (): Promise<LeagueResult> => ({
      kind: "not-found",
    }));

    render(<LeagueGate onCreate={onCreate} onJoin={onJoin} />);

    fireEvent.change(screen.getByPlaceholderText("2-30 个字符"), {
      target: { value: "兄弟联赛" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认创建联赛" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("兄弟联赛"));
  });

  it("joins a league with a code", async () => {
    const onCreate = vi.fn(async (): Promise<LeagueResult> => ({
      kind: "invalid-name",
    }));
    const onJoin = vi.fn(async (): Promise<LeagueResult> => ({
      kind: "ok",
      league: {
        id: "1",
        name: "兄弟联赛",
        joinCode: "ABC123",
        hostId: "host",
        memberIds: ["host", "m1"],
      },
    }));

    render(<LeagueGate onCreate={onCreate} onJoin={onJoin} />);

    fireEvent.click(screen.getByRole("button", { name: /加入联赛/ }));
    fireEvent.change(screen.getByPlaceholderText("6 位字母或数字"), {
      target: { value: "ABC123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认加入联赛" }));

    await waitFor(() => expect(onJoin).toHaveBeenCalledWith("ABC123"));
  });

  it("shows an error when creation fails", async () => {
    const onCreate = vi.fn(async (): Promise<LeagueResult> => ({
      kind: "invalid-name",
    }));
    const onJoin = vi.fn(async (): Promise<LeagueResult> => ({
      kind: "not-found",
    }));

    render(<LeagueGate onCreate={onCreate} onJoin={onJoin} />);

    fireEvent.click(screen.getByRole("button", { name: "确认创建联赛" }));

    await waitFor(() =>
      expect(screen.getByText("联赛名称需要 2-30 个字符。")).toBeInTheDocument(),
    );
  });
});
