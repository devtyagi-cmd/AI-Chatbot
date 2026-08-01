"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import LoginPage from "./LoginPage";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink-950">
        <Loader2 className="animate-spin text-brass-500" size={28} />
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <LoginPage />;
  }

  return <>{children}</>;
}
