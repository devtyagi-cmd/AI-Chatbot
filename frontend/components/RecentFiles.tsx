"use client";

import { useEffect, useState } from "react";
import { Clock, FileSpreadsheet } from "lucide-react";
import { listFiles, reopenFile, RecentFile, UploadResponse } from "@/lib/api";
import { useToast } from "@/lib/toast-context";

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentFiles({
  onReopened,
}: {
  onReopened: (res: UploadResponse) => void;
}) {
  const [files, setFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    listFiles().then((f) => {
      setFiles(f);
      setLoading(false);
    });
  }, []);

  async function handleReopen(fileId: string) {
    setReopeningId(fileId);
    try {
      const res = await reopenFile(fileId);
      onReopened(res);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Could not reopen file");
    } finally {
      setReopeningId(null);
    }
  }

  if (loading || files.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
        <Clock size={12} />
        Recent files (last 7 days)
      </h3>
      <div className="flex flex-col gap-1.5">
        {files.map((f) => (
          <button
            key={f.file_id}
            onClick={() => handleReopen(f.file_id)}
            disabled={reopeningId !== null}
            className="flex items-center gap-2.5 bg-white border border-gray-100 hover:border-brand-200 hover:bg-brand-50/40 transition-colors rounded-lg px-3 py-2.5 text-left disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={15} className="text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-800 truncate">{f.filename}</p>
              <p className="text-xs text-gray-400">
                {f.row_count != null ? `${f.row_count.toLocaleString()} rows · ` : ""}
                {timeAgo(f.uploaded_at)}
              </p>
            </div>
            {reopeningId === f.file_id && (
              <span className="text-xs text-brand-600 shrink-0">Opening...</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
