export interface Manager {
  id: string;
  username: string;
}

export interface AuthStore {
  getManager(id: string): Promise<Manager | undefined>;
  getManagerByUsername(username: string): Promise<Manager | undefined>;
  createManager(username: string): Promise<Manager>;
}

export type AuthResult =
  | { kind: "ok"; manager: Manager }
  | { kind: "invalid-credentials" }
  | { kind: "username-taken" }
  | { kind: "invalid-username" };
