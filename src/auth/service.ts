import type { AuthResult, AuthStore } from "./types.js";

export function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/.test(username.trim());
}

export class AuthService {
  constructor(private store: AuthStore) {}

  async signUp(username: string): Promise<AuthResult> {
    const trimmed = username.trim();
    if (!validateUsername(trimmed)) return { kind: "invalid-username" };
    const existing = await this.store.getManagerByUsername(trimmed);
    if (existing) return { kind: "username-taken" };
    const manager = await this.store.createManager(trimmed);
    return { kind: "ok", manager };
  }

  async signIn(username: string): Promise<AuthResult> {
    const trimmed = username.trim();
    if (!validateUsername(trimmed)) return { kind: "invalid-username" };
    const manager = await this.store.getManagerByUsername(trimmed);
    if (!manager) return { kind: "invalid-credentials" };
    return { kind: "ok", manager };
  }
}

export function createAuthService(store: AuthStore): AuthService {
  return new AuthService(store);
}
