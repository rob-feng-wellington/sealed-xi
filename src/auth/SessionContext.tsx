import React, { createContext, useContext, useMemo, useState } from "react";
import { readSessionManager, writeSessionManager } from "./store.js";
import type { Manager } from "./types.js";

export interface SessionContextValue {
  manager: Manager | null;
  signIn: (manager: Manager) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [manager, setManager] = useState<Manager | null>(() => readSessionManager());
  const value = useMemo<SessionContextValue>(() => ({
    manager,
    signIn: (next) => {
      writeSessionManager(next);
      setManager(next);
    },
    signOut: () => {
      writeSessionManager(null);
      setManager(null);
    },
  }), [manager]);
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
