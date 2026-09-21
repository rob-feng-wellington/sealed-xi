import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthForm } from "./AuthForm.js";
import type { AuthResult } from "../auth/types.js";

describe("AuthForm", () => {
  it("renders sign-in form and submits", async () => {
    const onSubmit = vi.fn(async (): Promise<AuthResult> => ({ kind: "ok", manager: { id: "1", username: "悟空" } }));
    const onSuccess = vi.fn();
    render(<AuthForm mode="sign-in" onSubmit={onSubmit} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("2-20 位字母、数字或中文"), {
      target: { value: "悟空" },
    });
    fireEvent.click(screen.getByRole("button", { name: /登录/ }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith("悟空");
  });

  it("shows error for invalid credentials", async () => {
    const onSubmit = vi.fn(async (): Promise<AuthResult> => ({ kind: "invalid-credentials" }));
    render(<AuthForm mode="sign-in" onSubmit={onSubmit} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("2-20 位字母、数字或中文"), {
      target: { value: "unknown" },
    });
    fireEvent.click(screen.getByRole("button", { name: /登录/ }));
    await waitFor(() =>
      expect(screen.getByText("用户名不存在。")).toBeInTheDocument(),
    );
  });
});
