"use client";

import { useState } from "react";
import { BarChart3, LogOut } from "lucide-react";
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
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className={uploaded ? "max-w-6xl mx-auto space-y-6" : "max-w-2xl mx-auto space-y-6"}>
        <header className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">AI Data Chatbot</h1>
            <p className="text-gray-500 text-sm">
              Upload a CSV or Excel file, then ask questions about it in plain English.
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
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
            <div className="space-y-3 lg:sticky lg:top-8">
              <DataProfile filename={uploaded.filename} profile={uploaded.profile} />
              <button
                className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors"
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
