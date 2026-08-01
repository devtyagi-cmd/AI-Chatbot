import { TableResult } from "@/lib/api";

export default function DataTable({ table }: { table: TableResult }) {
  const isNumeric = (col: string) =>
    table.rows.length > 0 && typeof table.rows[0][col] === "number";

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02]">
      <div className="overflow-x-auto max-h-72 scroll-thin">
        <table className="text-sm w-full border-collapse">
          <thead className="bg-white/[0.04] sticky top-0 backdrop-blur-sm">
            <tr>
              {table.columns.map((c) => (
                <th
                  key={c}
                  className={`text-left px-2 py-1.5 whitespace-nowrap border-b border-white/10 font-medium text-mist-300 ${
                    isNumeric(c) ? "text-right" : ""
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr
                key={i}
                className="odd:bg-white/[0.015] even:bg-transparent hover:bg-brass-500/[0.06] transition-colors"
              >
                {table.columns.map((c) => (
                  <td
                    key={c}
                    className={`px-2 py-1.5 whitespace-nowrap text-mist-100/85 ${
                      isNumeric(c) ? "text-right font-mono tabular-nums" : ""
                    }`}
                  >
                    {String(row[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.truncated && (
        <p className="text-xs text-mist-400 px-2 py-1.5 bg-white/[0.03] border-t border-white/10">
          Showing first rows only — the full result set is larger.
        </p>
      )}
    </div>
  );
}
