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
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-emerald-50 border-emerald-200 text-emerald-700"
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
