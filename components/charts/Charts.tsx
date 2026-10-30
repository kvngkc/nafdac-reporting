"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SERIES = "#008751";
const GRID = "#e2e8f0";
const AXIS = "#64748b";
const INK = "#334155";

const tooltipStyle = {
  contentStyle: { borderRadius: 8, borderColor: GRID, fontSize: 13 },
  labelStyle: { color: INK, fontWeight: 600 },
  itemStyle: { color: INK },
};

export function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES} stopOpacity={0.18} />
              <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip {...tooltipStyle} labelFormatter={(d) => fmt(String(d))} formatter={(v) => [v, "Complaints"]} cursor={{ stroke: AXIS, strokeDasharray: "3 3" }} />
          <Area type="linear" dataKey="count" stroke={SERIES} strokeWidth={2} fill="url(#trendFill)" activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bar chart: one series, direct value labels at the bar end. */
export function RankBarChart({ data, label = "Complaints" }: { data: { name: string; count: number }[]; label?: string }) {
  const height = Math.max(120, data.length * 32 + 16);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={170} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} interval={0} />
          <Tooltip {...tooltipStyle} formatter={(v) => [v, label]} cursor={{ fill: "#f1f5f9" }} />
          <Bar dataKey="count" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList dataKey="count" position="right" style={{ fill: INK, fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
