import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionProvider, useSession } from "./SessionContext.js";
import { AuthService, createAuthService, validateUsername } from "./service.js";
import {
  InMemoryAuthStore,
  LocalStorageAuthStore,
  readSessionManager,
  writeSessionManager,
} from "./store.js";

describe("AuthService", () => {
  let store: InMemoryAuthStore;
  let auth: AuthService;
  beforeEach(() => {
    store = new InMemoryAuthStore();
    auth = createAuthService(store);
  });

  it("signs up a new manager", async () => {
    const result = await auth.signUp("悟空");
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.manager.username).toBe("悟空");
  });

  it("rejects duplicate usernames", async () => {
    await auth.signUp("悟空");
    const result = await auth.signUp("悟空");
    expect(result.kind).toBe("username-taken");
  });

  it("signs in an existing manager", async () => {
    const created = await auth.signUp("贝吉塔");
    expect(created.kind).toBe("ok");
    const result = await auth.signIn("贝吉塔");
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.manager.username).toBe("贝吉塔");
  });

  it("rejects unknown username on sign in", async () => {
    const result = await auth.signIn("不存在");
    expect(result.kind).toBe("invalid-credentials");
  });

  it("rejects invalid username formats", async () => {
    const result = await auth.signUp("a");
    expect(result.kind).toBe("invalid-username");
  });
});

describe("LocalStorageAuthStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists a created manager across store instances", async () => {
    const first = new LocalStorageAuthStore();
    await first.createManager("悟空");

    const second = new LocalStorageAuthStore();
    const manager = await second.getManagerByUsername("悟空");

    expect(manager).toEqual({ id: "1", username: "悟空" });
  });
});

describe("session storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no session is stored", () => {
    expect(readSessionManager()).toBeNull();
  });

  it("round-trips a manager and clears on sign out", () => {
    const manager = { id: "1", username: "悟空" };
    writeSessionManager(manager);
    expect(readSessionManager()).toEqual(manager);
    writeSessionManager(null);
    expect(readSessionManager()).toBeNull();
  });
});

function SessionReader() {
  const { manager } = useSession();
  return React.createElement("div", null, manager?.username ?? "signed-out");
}

describe("SessionProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restores a signed-in manager on mount", () => {
    writeSessionManager({ id: "1", username: "悟空" });
    render(
      React.createElement(
        SessionProvider,
        null,
        React.createElement(SessionReader),
      ),
    );
    expect(screen.getByText("悟空")).toBeInTheDocument();
  });
});

describe("validateUsername", () => {
  it("accepts valid names", () => {
    expect(validateUsername("player1")).toBe(true);
    expect(validateUsername("悟空")).toBe(true);
    expect(validateUsername("u_2")).toBe(true);
  });

  it("rejects short or empty names", () => {
    expect(validateUsername("a")).toBe(false);
    expect(validateUsername("")).toBe(false);
    expect(validateUsername("  ")).toBe(false);
  });

  it("rejects names with special characters", () => {
    expect(validateUsername("hello world")).toBe(false);
    expect(validateUsername("foo@bar")).toBe(false);
  });
});
