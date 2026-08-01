"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import DataProfile from "@/components/DataProfile";
import ChatWindow from "@/components/ChatWindow";
import RecentFiles from "@/components/RecentFiles";
import { UploadResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const [uploaded, setUploaded] = useState<UploadResponse | null>(null);
  const { logout } = useAuth();

  return (
    <main className="relative min-h-screen bg-ink-950 bg-dot-grid py-10 px-4 overflow-hidden">
      {/* Signature backdrop: fine dot-grid texture (globals.css) plus a
          quiet ambient glow anchored top-right - a data-terminal surface,
          not a flat gradient. */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[32rem] h-[32rem] bg-brass-600/10 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="pointer-events-none absolute top-1/3 -left-32 w-96 h-96 bg-azure-400/[0.06] rounded-full blur-[100px]" />

      <div
        className={`relative ${
          uploaded ? "max-w-6xl mx-auto space-y-8" : "max-w-2xl mx-auto space-y-8"
        }`}
      >
        <header className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] tracking-[0.2em] uppercase text-brass-500/80 font-medium mb-1">
              Analytics Desk
            </p>
            <h1 className="font-display italic text-2xl text-white tracking-tight">
              AI Data Chatbot
            </h1>
            <p className="text-mist-300 text-[13px] mt-1">
              Upload a spreadsheet, then ask questions about it in plain English.
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </header>

        {!uploaded && (
          <div className="space-y-6">
            <FileUpload onUploaded={setUploaded} />
            <RecentFiles onReopened={setUploaded} />
          </div>
        )}

        {uploaded && (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
            <div className="space-y-3 lg:sticky lg:top-10">
              <DataProfile filename={uploaded.filename} profile={uploaded.profile} />
              <button
                className="text-sm text-white/30 hover:text-white/60 underline transition-colors"
                onClick={() => setUploaded(null)}
              >
                Upload a different file
              </button>
            </div>
            <ChatWindow fileId={uploaded.file_id} />
          </div>
        )}
      </div>
    </main>
  );
}
