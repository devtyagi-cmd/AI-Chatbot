"use client";

import { FormEvent, useState } from "react";
import { BarChart3, Eye, EyeOff, Lock, LogIn, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);
    const ok = await login(username, password);
    setLoading(false);

    if (!ok) {
      setError("Incorrect username or password.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-950 bg-dot-grid px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 bg-brass-600/10 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 bg-azure-400/[0.06] rounded-full blur-[100px]" />

      <div className="w-full max-w-sm relative animate-fade-in">
        <div className="text-center mb-7">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brass-500/10 border border-brass-500/25 flex items-center justify-center mb-4">
            <BarChart3 size={24} className="text-brass-400" />
          </div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-brass-500/80 font-medium mb-1.5">
            Analytics Desk
          </p>
          <h1 className="font-display italic text-2xl text-white">AI Data Chatbot</h1>
          <p className="text-sm text-mist-400 mt-1.5">Sign in to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-2xl shadow-black/40 rounded-2xl p-7 space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-mist-400 mb-1.5 block">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-400" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-mist-100 placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-brass-500/30 focus:border-brass-500/40 transition-shadow"
                placeholder="team-login"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-mist-400 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-mist-100 placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-brass-500/30 focus:border-brass-500/40 transition-shadow"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-400 hover:text-mist-300 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-coral-400 bg-coral-500/10 border border-coral-400/25 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full inline-flex items-center justify-center gap-2 bg-brass-500 hover:bg-brass-600 active:bg-brass-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-ink-950 rounded-lg py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brass-400/50"
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <LogIn size={16} />
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-mist-400 mt-5">
          Don&apos;t have login details? Ask your team admin.
        </p>
      </div>
    </main>
  );
}
