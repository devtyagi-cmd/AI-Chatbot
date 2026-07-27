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
        className={`border-2 border-dashed rounded-2xl p-10 text-center bg-white transition-all duration-150 ${
          dragOver
            ? "border-brand-400 bg-brand-50 scale-[1.01]"
            : "border-gray-300"
        }`}
      >
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
          {dragOver ? (
            <FileSpreadsheet className="text-brand-600" size={22} />
          ) : (
            <UploadCloud className="text-brand-600" size={22} />
          )}
        </div>
        <p className="mb-4 text-gray-600 text-sm">
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
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 transition-colors text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          {loading ? "Uploading..." : "Choose file"}
        </button>
      </div>
      {error && <StatusBanner kind="error" message={error} />}
    </div>
  );
}
