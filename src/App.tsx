import React, { useState } from "react";
import { createAuthService, LocalStorageAuthStore, SessionProvider, useSession } from "./auth/index.js";
import { AuthForm } from "./components/AuthForm.js";

const authService = createAuthService(new LocalStorageAuthStore());

function Home() {
  const { manager, signIn, signOut } = useSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [welcome, setWelcome] = useState(false);

  if (manager) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">欢迎，{manager.username}</h1>
        <p className="text-slate-400">你已进入迷之十一人。</p>
        <button
          onClick={signOut}
          className="rounded bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
        >
          退出
        </button>
      </div>
    );
  }

  return (
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
  );
}

export default function App() {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <Home />
      </div>
    </SessionProvider>
  );
}
