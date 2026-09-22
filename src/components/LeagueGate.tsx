import React, { useState } from "react";
import type { LeagueResult } from "../league/types.js";

interface LeagueGateProps {
  onCreate: (name: string) => Promise<LeagueResult>;
  onJoin: (code: string) => Promise<LeagueResult>;
}

export function LeagueGate({ onCreate, onJoin }: LeagueGateProps) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await onCreate(name);
    setSubmitting(false);
    if (result.kind !== "ok") {
      setError(errorMessage(result.kind));
    }
  }

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await onJoin(code);
    setSubmitting(false);
    if (result.kind !== "ok") {
      setError(errorMessage(result.kind));
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <h1 className="text-center text-2xl font-bold">加入私人联赛</h1>
      <p className="text-center text-slate-400">
        先创建联赛或加入朋友的联赛，才能开始游戏。
      </p>

      <div className="flex rounded bg-slate-800 p-1">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 rounded px-3 py-1.5 text-sm ${
            mode === "create"
              ? "bg-slate-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          创建联赛
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`flex-1 rounded px-3 py-1.5 text-sm ${
            mode === "join"
              ? "bg-slate-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          加入联赛
        </button>
      </div>

      {error && (
        <div className="rounded bg-red-900/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {mode === "create" ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm text-slate-300">联赛名称</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="2-30 个字符"
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            aria-label="确认创建联赛"
            disabled={submitting}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-slate-600"
          >
            创建并进入
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm text-slate-300">邀请码</span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6 位字母或数字"
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            aria-label="确认加入联赛"
            disabled={submitting}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-slate-600"
          >
            加入联赛
          </button>
        </form>
      )}
    </div>
  );
}

function errorMessage(kind: Exclude<LeagueResult["kind"], "ok">): string {
  switch (kind) {
    case "invalid-name":
      return "联赛名称需要 2-30 个字符。";
    case "invalid-code":
      return "邀请码是 6 位字母或数字。";
    case "not-found":
      return "找不到该邀请码对应的联赛。";
    case "already-member":
      return "你已经在一个联赛中了。";
  }
}
