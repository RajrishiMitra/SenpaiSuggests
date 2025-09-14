"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { useState } from "react"

const COLORS = [
  "#ff4dff", // Neon Pink
  "#4d94ff", // Neon Blue
  "#a64dff", // Neon Purple
  "#4dffff", // Neon Cyan
  "#4dff88", // Neon Green
]

const CustomCell = ({
  fill,
  index,
  onMouseEnter,
  onMouseLeave,
}: {
  fill: string
  index: number
  onMouseEnter: () => void
  onMouseLeave: () => void
}) => {
  return (
    <Cell
      key={index}
      fill={fill}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        filter: `drop-shadow(0 0 8px ${fill}40)`,
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      className="hover:scale-105"
    />
  )
}

export function GenreChart({
  data = [
    { name: "Shonen", value: 45 },
    { name: "Seinen", value: 25 },
    { name: "Shojo", value: 15 },
    { name: "Slice of Life", value: 15 },
  ],
}: {
  data?: { name: string; value: number }[]
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="neon-border-solid rounded-xl p-4 relative" style={{ backgroundColor: "#0A0C14" }}>
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              innerRadius={50}
              outerRadius={hoveredIndex !== null ? 95 : 90}
            >
              {data.map((entry, i) => (
                <CustomCell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  index={i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(17,24,39,.95)",
                border: "1px solid rgba(255,255,255,.2)",
                borderRadius: "8px",
                boxShadow: "0 0 20px rgba(255,77,255,0.3)",
              }}
              labelStyle={{ color: "white", fontWeight: "600" }}
              itemStyle={{ color: "white" }}
              formatter={(value: number, name: string) => [`${value}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h3 className="text-lg font-bold bg-gradient-to-r from-[#ff4dff] via-[#4d94ff] to-[#4dffff] bg-clip-text text-transparent">
              Trending
            </h3>
            <h3 className="text-lg font-bold bg-gradient-to-r from-[#4dffff] via-[#a64dff] to-[#ff4dff] bg-clip-text text-transparent -mt-1">
              Genres
            </h3>
          </div>
        </div>
      </div>
    </div>
  )
}
