"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { useAdminStore } from "@/store/useAdminStore"

export function ActiveRoutesChart() {
  const analytics = useAdminStore((state) => state.analytics);
  const data = analytics?.activeRoutes || [];
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
          itemStyle={{ color: "#e4e4e7" }}
          formatter={(value: number | string | Array<number | string> | undefined) => {
            if (value === undefined) return ['', ''];
            return [`${value} usuarios`, ''];
          }}
        />
      </PieChart>
    </ResponsiveContainer>
    </div>
  )
}
