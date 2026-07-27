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

// Single source of truth for chart colors, so bars/lines/pies all read as
// one consistent palette instead of separately-chosen hex codes.
export const CHART_COLORS = [
  "#4f46e5", // brand-600
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
];

export default function ChartRenderer({ chart }: { chart: ChartResult }) {
  const data = chart.data;

  // Long category labels (month names, product names, etc.) collide when
  // drawn horizontally - angle them once there are enough categories to
  // make that likely.
  const rotateLabels = data.length > 6;
  const xAxisProps = rotateLabels
    ? { angle: -35, textAnchor: "end" as const, height: 60 }
    : {};

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm animate-fade-in">
      <h4 className="text-sm font-medium mb-2 text-gray-700">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={280}>
        {chart.type === "bar" ? (
          <BarChart data={data} margin={{ bottom: rotateLabels ? 20 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey={chart.x} tick={{ fontSize: 12 }} {...xAxisProps} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey={chart.y} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chart.type === "line" ? (
          <LineChart data={data} margin={{ bottom: rotateLabels ? 20 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey={chart.x} tick={{ fontSize: 12 }} {...xAxisProps} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={chart.y}
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        ) : (
          <PieChart>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
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
