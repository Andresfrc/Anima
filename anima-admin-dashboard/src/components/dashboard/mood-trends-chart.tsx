"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useAdminStore } from "@/store/useAdminStore"

export function MoodTrendsChart() {
  const analytics = useAdminStore((state) => state.analytics);
  const data = analytics?.weeklyMood || [];
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: -20,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorMuyTriste" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorTriste" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorMejor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAnimado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          stroke="#52525b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#52525b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
          itemStyle={{ color: "#e4e4e7" }}
        />
        <Area
          type="monotone"
          dataKey="animado"
          name="Animado"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorAnimado)"
        />
        <Area
          type="monotone"
          dataKey="mejor"
          name="Mejor"
          stroke="#4ade80"
          fillOpacity={1}
          fill="url(#colorMejor)"
        />
        <Area
          type="monotone"
          dataKey="neutral"
          name="Neutral"
          stroke="#a1a1aa"
          fillOpacity={1}
          fill="url(#colorNeutral)"
        />
        <Area
          type="monotone"
          dataKey="triste"
          name="Triste"
          stroke="#f97316"
          fillOpacity={1}
          fill="url(#colorTriste)"
        />
        <Area
          type="monotone"
          dataKey="muyTriste"
          name="Muy Triste"
          stroke="#ef4444"
          fillOpacity={1}
          fill="url(#colorMuyTriste)"
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  )
}
