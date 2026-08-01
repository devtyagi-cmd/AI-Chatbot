import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function StatusBanner({
  kind,
  message,
}: {
  kind: "error" | "success";
  message: string;
}) {
  const isError = kind === "error";
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm animate-fade-in ${
        isError
          ? "bg-coral-500/10 border-coral-400/25 text-coral-400"
          : "bg-emerald-500/10 border-emerald-400/25 text-emerald-400"
      }`}
    >
      {isError ? (
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
