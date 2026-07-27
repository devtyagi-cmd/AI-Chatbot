import { TableResult } from "@/lib/api";

export default function DataTable({ table }: { table: TableResult }) {
  const isNumeric = (col: string) =>
    table.rows.length > 0 && typeof table.rows[0][col] === "number";

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto max-h-72 scroll-thin">
        <table className="text-sm w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {table.columns.map((c) => (
                <th
                  key={c}
                  className={`text-left px-2 py-1.5 whitespace-nowrap border-b border-gray-100 font-medium text-gray-600 ${
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
                className="odd:bg-white even:bg-gray-50/50 hover:bg-brand-50/60 transition-colors"
              >
                {table.columns.map((c) => (
                  <td
                    key={c}
                    className={`px-2 py-1.5 whitespace-nowrap text-gray-700 ${
                      isNumeric(c) ? "text-right tabular-nums" : ""
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
        <p className="text-xs text-gray-400 px-2 py-1.5 bg-gray-50 border-t border-gray-100">
          Showing first rows only — the full result set is larger.
        </p>
      )}
    </div>
  );
}
