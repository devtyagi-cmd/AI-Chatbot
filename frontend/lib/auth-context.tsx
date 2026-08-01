"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { checkAuth, login as apiLogin, logout as apiLogout } from "./api";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    // On load: is there already a valid stored session, or is the login
    // gate disabled entirely (e.g. local dev with no BASIC_AUTH_* set)?
    // Either way, this decides whether to show the login screen at all.
    checkAuth().then((ok) => setStatus(ok ? "authenticated" : "unauthenticated"));
  }, []);

  async function login(username: string, password: string): Promise<boolean> {
    const ok = await apiLogin(username, password);
    setStatus(ok ? "authenticated" : "unauthenticated");
    return ok;
  }

  function logout(): void {
    apiLogout();
    setStatus("unauthenticated");
  }

  return (
    <AuthContext.Provider value={{ status, login, logout }}>{children}</AuthContext.Provider>
  );
}
