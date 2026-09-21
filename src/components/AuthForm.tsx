import React, { useState } from "react";
import type { AuthResult } from "../auth/types.js";

export type AuthMode = "sign-in" | "sign-up";

export interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (username: string) => Promise<AuthResult>;
  onSuccess: () => void;
}

export function AuthForm({ mode, onSubmit, onSuccess }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await onSubmit(username);
      if (result.kind === "ok") {
        onSuccess();
      } else {
        setError(messageForResult(result.kind));
      }
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "sign-up" ? "创建经理" : "经理登录";
  const action = mode === "sign-up" ? "注册" : "登录";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
      <label className="block">
        <span className="text-sm text-slate-300">用户名</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 block w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
          placeholder="2-20 位字母、数字或中文"
          required
          minLength={2}
          maxLength={20}
        />
      </label>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy || username.trim().length < 2}
        className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "处理中..." : action}
      </button>
    </form>
  );
}

function messageForResult(kind: AuthResult["kind"]): string {
  switch (kind) {
    case "invalid-credentials":
      return "用户名不存在。";
    case "username-taken":
      return "用户名已被使用。";
    case "invalid-username":
      return "用户名需为 2-20 位字母、数字或中文。";
    default:
      return "未知错误";
  }
}
