import React from "react";
import type { League } from "../league/types.js";

interface LeagueHomeProps {
  league: League;
  managerUsername: string;
  onSignOut: () => void;
}

export function LeagueHome({ league, managerUsername, onSignOut }: LeagueHomeProps) {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{league.name}</h1>
        <p className="text-slate-400">欢迎，{managerUsername}</p>
      </div>

      <div className="rounded bg-slate-800 p-4">
        <h2 className="mb-2 text-sm font-medium text-slate-300">邀请码</h2>
        <div className="flex items-center justify-between">
          <code className="text-xl font-bold tracking-widest text-blue-400">
            {league.joinCode}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(league.joinCode)}
            className="rounded bg-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-600"
          >
            复制
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          把邀请码发给朋友，他们输入即可加入。
        </p>
      </div>

      <div className="rounded bg-slate-800 p-4">
        <h2 className="mb-2 text-sm font-medium text-slate-300">
          成员 ({league.memberIds.length})
        </h2>
        <ul className="divide-y divide-slate-700">
          {league.memberIds.map((id) => (
            <li key={id} className="py-2 text-sm text-slate-400">
              {id === league.hostId ? "👑 房主" : "成员"} · {id}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onSignOut}
        className="w-full rounded bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
      >
        退出登录
      </button>
    </div>
  );
}
