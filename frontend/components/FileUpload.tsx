"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { uploadFile, UploadResponse } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import StatusBanner from "./StatusBanner";

export default function FileUpload({
  onUploaded,
}: {
  onUploaded: (res: UploadResponse) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { showToast } = useToast();

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const res = await uploadFile(file);
      showToast("success", `"${res.filename}" uploaded successfully`);
      onUploaded(res);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`border rounded-2xl p-12 text-center backdrop-blur-sm transition-all duration-150 ${
          dragOver
            ? "border-brass-500/50 bg-brass-500/[0.06] scale-[1.005]"
            : "border-white/10 bg-white/[0.03]"
        }`}
      >
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-brass-500/10 border border-brass-500/20 flex items-center justify-center">
          {dragOver ? (
            <FileSpreadsheet className="text-brass-400" size={20} />
          ) : (
            <UploadCloud className="text-brass-400" size={20} />
          )}
        </div>
        <p className="mb-5 text-mist-300 text-sm">
          Drag &amp; drop a CSV or Excel file here, or
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="px-5 py-2.5 bg-brass-500 hover:bg-brass-600 active:bg-brass-700 transition-colors text-ink-950 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brass-400/50"
        >
          {loading ? "Uploading..." : "Choose file"}
        </button>
      </div>
      {error && <StatusBanner kind="error" message={error} />}
    </div>
  );
}
