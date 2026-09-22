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

  it("shows the league home after creating a league", async () => {
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

    fireEvent.change(screen.getByPlaceholderText("2-30 个字符"), {
      target: { value: "兄弟联赛" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认创建联赛" }));

    await waitFor(() =>
      expect(screen.getByText("兄弟联赛")).toBeInTheDocument(),
    );
    expect(screen.getByText("把邀请码发给朋友，他们输入即可加入。")).toBeInTheDocument();
  });
});
