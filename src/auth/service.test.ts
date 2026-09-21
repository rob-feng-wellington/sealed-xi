import { describe, it, expect, beforeEach } from "vitest";
import { AuthService, createAuthService, validateUsername } from "./service.js";
import { InMemoryAuthStore } from "./store.js";

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
