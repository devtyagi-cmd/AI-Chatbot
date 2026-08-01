"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartResult } from "@/lib/api";

// Refined analytics palette - muted brass as the primary series, with
// emerald/coral reserved for their financial connotation (gain/loss) when
// a chart has multiple series, azure/violet as tertiary/quaternary.
export const CHART_COLORS = ["#C9A15A", "#35C29A", "#5B8DEF", "#E2685F", "#9C8CF0", "#D4B26E"];

const TOOLTIP_STYLE = {
  backgroundColor: "#141C2E",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
  color: "#EDEFF5",
};

export default function ChartRenderer({ chart }: { chart: ChartResult }) {
  const data = chart.data;

  const rotateLabels = data.length > 6;
  const xAxisProps = rotateLabels
    ? { angle: -35, textAnchor: "end" as const, height: 60 }
    : {};

  return (
    <div className="bg-white/[0.03] rounded-lg p-3 border border-white/10 animate-fade-in">
      <h4 className="text-sm font-medium mb-2 text-mist-100/90">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={280}>
        {chart.type === "bar" ? (
          <BarChart data={data} margin={{ bottom: rotateLabels ? 20 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey={chart.x}
              tick={{ fontSize: 12, fill: "#96A0B8" }}
              {...xAxisProps}
            />
            <YAxis tick={{ fontSize: 12, fill: "#96A0B8" }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey={chart.y} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chart.type === "line" ? (
          <LineChart data={data} margin={{ bottom: rotateLabels ? 20 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey={chart.x}
              tick={{ fontSize: 12, fill: "#96A0B8" }}
              {...xAxisProps}
            />
            <YAxis tick={{ fontSize: 12, fill: "#96A0B8" }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey={chart.y}
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_COLORS[0] }}
            />
          </LineChart>
        ) : (
          <PieChart>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#96A0B8" }} />
            <Pie
              data={data}
              dataKey={chart.y}
              nameKey={chart.x}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
