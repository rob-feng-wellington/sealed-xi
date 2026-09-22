import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App.js";

// jsdom does not implement clipboard API; polyfill for the copy button.
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

async function signUpAndCreateLeague(username = "悟空", leagueName = "兄弟联赛") {
  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: /立即注册/ }));
  fireEvent.change(screen.getByPlaceholderText("2-20 位字母、数字或中文"), {
    target: { value: username },
  });
  fireEvent.click(screen.getByRole("button", { name: /注册/ }));

  await waitFor(() =>
    expect(screen.getByText("注册成功，请登录。")).toBeInTheDocument(),
  );

  fireEvent.click(screen.getByRole("button", { name: /登录/ }));

  await waitFor(() =>
    expect(screen.getByText("加入私人联赛")).toBeInTheDocument(),
  );

  fireEvent.change(screen.getByPlaceholderText("2-30 个字符"), {
    target: { value: leagueName },
  });
  fireEvent.click(screen.getByRole("button", { name: "确认创建联赛" }));

  await waitFor(() => expect(screen.getByText(leagueName)).toBeInTheDocument());
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the league gate after sign-in when the manager has no league", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /立即注册/ }));
    fireEvent.change(screen.getByPlaceholderText("2-20 位字母、数字或中文"), {
      target: { value: "悟空" },
    });
    fireEvent.click(screen.getByRole("button", { name: /注册/ }));

    await waitFor(() =>
      expect(screen.getByText("注册成功，请登录。")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /登录/ }));

    await waitFor(() =>
      expect(screen.getByText("加入私人联赛")).toBeInTheDocument(),
    );
  });

  it("shows the league home and this week's tasks after creating a league", async () => {
    await signUpAndCreateLeague();

    expect(screen.getByText("把邀请码发给朋友，他们输入即可加入。")).toBeInTheDocument();
    expect(screen.getByText("本周任务")).toBeInTheDocument();
    expect(await screen.findByText("提交暂定阵容")).toBeInTheDocument();
  });

  it("opens this Gameweek's packs from the Private league home", async () => {
    await signUpAndCreateLeague();

    expect(screen.getByText("本周卡包")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "开启本周卡包" }));

    await waitFor(() =>
      expect(screen.getByText("基础包 · 24 张")).toBeInTheDocument(),
    );
    expect(screen.getByText("技能包 · 14 张")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "开启本周卡包" })).not.toBeInTheDocument();
    expect(await screen.findByText("我的阵容")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "锁定阵容" })).toBeInTheDocument();
  });
});
