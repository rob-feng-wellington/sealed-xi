import React, { useEffect, useState } from "react";
import {
  createAuthService,
  LocalStorageAuthStore,
  SessionProvider,
  useSession,
} from "./auth/index.js";
import { AuthForm } from "./components/AuthForm.js";
import { GameweekScreen } from "./components/GameweekScreen.js";
import { LeagueGate } from "./components/LeagueGate.js";
import { LeagueHome } from "./components/LeagueHome.js";
import { TaskCapPanel } from "./components/TaskCapPanel.js";
import {
  createPackService,
  createTaskCapService,
  currentGameweekId,
  LocalStorageLineupStore,
  LocalStoragePoolStore,
  LocalStorageTaskCapStore,
} from "./gameweek/index.js";
import {
  createLeagueService,
  LocalStorageLeagueStore,
  type League,
} from "./league/index.js";

const authService = createAuthService(new LocalStorageAuthStore());
const leagueService = createLeagueService(new LocalStorageLeagueStore());
const packService = createPackService(new LocalStoragePoolStore());
const taskCapService = createTaskCapService(
  new LocalStorageTaskCapStore(),
  new LocalStorageLeagueStore(),
  new LocalStorageLineupStore(),
  undefined,
  packService,
);

function Home() {
  const { manager, signIn, signOut } = useSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [welcome, setWelcome] = useState(false);
  const [league, setLeague] = useState<League | null | undefined>(undefined);

  useEffect(() => {
    if (!manager) {
      setLeague(undefined);
      return;
    }
    let cancelled = false;
    leagueService.getLeagueForManager(manager.id).then((found) => {
      if (!cancelled) setLeague(found ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [manager]);

  if (!manager) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center">
        <div className="space-y-6 w-full max-w-sm">
          {welcome && (
            <div className="rounded bg-green-900/40 p-3 text-sm text-green-200">
              注册成功，请登录。
            </div>
          )}
          <AuthForm
            mode={mode}
            onSubmit={(username) =>
              mode === "sign-up"
                ? authService.signUp(username)
                : authService.signIn(username)
            }
            onSuccess={(signedInManager) => {
              if (mode === "sign-up") {
                setWelcome(true);
                setMode("sign-in");
                return;
              }
              signIn(signedInManager);
            }}
          />
          <p className="text-center text-sm text-slate-400">
            {mode === "sign-in" ? "还没有账号？" : "已有账号？"}
            <button
              type="button"
              onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              className="ml-1 text-blue-400 hover:text-blue-300"
            >
              {mode === "sign-in" ? "立即注册" : "返回登录"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (league === undefined) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center text-slate-400">
        加载中…
      </div>
    );
  }

  if (league === null) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center">
        <LeagueGate
          onCreate={async (name) => {
            const result = await leagueService.createLeague(name, manager.id);
            if (result.kind === "ok") {
              setLeague(result.league);
            }
            return result;
          }}
          onJoin={async (code) => {
            const result = await leagueService.joinLeague(manager.id, code);
            if (result.kind === "ok") {
              setLeague(result.league);
            }
            return result;
          }}
        />
      </div>
    );
  }

  const gameweekId = currentGameweekId();

  return (
    <div className="w-full max-w-3xl space-y-8 py-8">
      <LeagueHome
        league={league}
        managerUsername={manager.username}
        onSignOut={signOut}
      />
      <TaskCapPanel
        managerId={manager.id}
        league={league}
        gameweekId={gameweekId}
        taskCapService={taskCapService}
      />
      <GameweekScreen
        managerId={manager.id}
        gameweekId={gameweekId}
        packService={packService}
        onTentativeSaved={() => {
          void taskCapService.markTentativeLineup(
            manager.id,
            gameweekId,
            new Date(),
          );
        }}
        onPoolOpened={() => {
          void taskCapService.ensureReward(manager.id, gameweekId);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center p-4">
        <Home />
      </div>
    </SessionProvider>
  );
}
