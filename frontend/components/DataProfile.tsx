import { AlignLeft, Calendar, Hash, ToggleLeft, Wand2 } from "lucide-react";
import { ColumnInfo, FileProfile } from "@/lib/api";

function dtypeIcon(dtype: string) {
  const d = dtype.toLowerCase();
  if (d.includes("int") || d.includes("float")) {
    return <Hash size={11} className="shrink-0" />;
  }
  if (d.includes("datetime") || d.includes("date")) {
    return <Calendar size={11} className="shrink-0" />;
  }
  if (d.includes("bool")) {
    return <ToggleLeft size={11} className="shrink-0" />;
  }
  return <AlignLeft size={11} className="shrink-0" />;
}

function isNumericDtype(dtype: string) {
  const d = dtype.toLowerCase();
  return d.includes("int") || d.includes("float");
}

export default function DataProfile({
  filename,
  profile,
}: {
  filename: string;
  profile: FileProfile;
}) {
  const missingEntries = Object.entries(profile.missing_values);
  const numericCols = new Set(
    profile.columns.filter((c) => isNumericDtype(c.dtype)).map((c) => c.name)
  );

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 space-y-4 border border-white/10">
      <div>
        <h2 className="font-display text-lg text-white truncate" title={filename}>
          {filename}
        </h2>
        <p className="text-sm text-mist-400 font-mono">
          {profile.row_count.toLocaleString()} rows · {profile.column_count} columns
        </p>
        {!!profile.removed_summary_rows && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-brass-400 bg-brass-500/10 border border-brass-500/20 rounded-full px-2 py-0.5">
            <Wand2 size={11} />
            Removed {profile.removed_summary_rows} likely total/summary row
            {profile.removed_summary_rows > 1 ? "s" : ""} from the bottom of the file
          </p>
        )}
      </div>

      <div>
        <h3 className="font-medium mb-1.5 text-[11px] uppercase tracking-widest text-mist-400">
          Columns
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {profile.columns.map((c: ColumnInfo) => (
            <span
              key={c.name}
              title={c.dtype}
              className="inline-flex items-center gap-1 text-xs bg-white/[0.04] border border-white/10 rounded-full px-2 py-1 text-mist-100/90"
            >
              {dtypeIcon(c.dtype)}
              {c.name}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-1.5 text-[11px] uppercase tracking-widest text-mist-400">
          Missing values
        </h3>
        {missingEntries.length === 0 ? (
          <p className="text-sm text-mist-300">None</p>
        ) : (
          <ul className="text-sm text-mist-300 space-y-0.5 font-mono">
            {missingEntries.map(([col, count]) => (
              <li key={col} className="flex justify-between">
                <span className="font-sans">{col}</span>
                <span className="text-coral-400">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-medium mb-1.5 text-[11px] uppercase tracking-widest text-mist-400">
          Preview
        </h3>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="text-sm w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.03]">
                {profile.columns.map((c) => (
                  <th
                    key={c.name}
                    className={`text-left border-b border-white/10 px-2 py-1.5 whitespace-nowrap font-medium text-mist-300 ${
                      numericCols.has(c.name) ? "text-right" : ""
                    }`}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profile.preview.map((row, i) => (
                <tr
                  key={i}
                  className="odd:bg-white/[0.015] even:bg-transparent hover:bg-brass-500/[0.06] transition-colors"
                >
                  {profile.columns.map((c) => (
                    <td
                      key={c.name}
                      className={`px-2 py-1.5 whitespace-nowrap text-mist-100/85 ${
                        numericCols.has(c.name) ? "text-right font-mono tabular-nums" : ""
                      }`}
                    >
                      {String(row[c.name] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
