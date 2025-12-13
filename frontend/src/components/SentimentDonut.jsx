// this donut chart is for showing sentiment distribution split: how many posts are positive/neutral/negative

import React from "react";
import { Group, Text, Stack } from "@mantine/core";

// I use recharts directly because it lets me set a fixed width/height.
// This avoids the "width/height must be > 0" warning completely.
import { PieChart, Pie, Cell } from "recharts";


// update: this renders one legend row like: ● Positive
function LegendItem({ color, label }) {
  return (
    <Group gap={6}>
      {/* small colored square */}
      <div
        style={{
          width: 10,
          height: 10,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Group>
  );
}

export default function SentimentDonut({ pos, neu, neg }) {
  // calculating the total so i can show percentages easily
  const total = (Number(pos) || 0) + (Number(neu) || 0) + (Number(neg) || 0);

  // this is the chart input format (recharts wants name + value)
  const chartData = [
    { name: "Positive", value: Number(pos) || 0 },
    { name: "Neutral", value: Number(neu) || 0 },
    { name: "Negative", value: Number(neg) || 0 },
  ];

  // Helper to avoid divide-by-zero
  const pct = (v) => (total ? Math.round((Number(v) / total) * 100) : 0);

  // I keep colors simple and readable in dark mode
  const COLORS = ["#2f9e44", "#868e96", "#e03131"]; // green, gray, red

  return (
    <Group justify="space-between" align="center" wrap="nowrap">
      {/* I give the chart a fixed pixel size so it always renders */}
        <Stack gap={8} align="flex-start">
        <PieChart width={220} height={220}>
            <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={95}
            paddingAngle={2}
            isAnimationActive={false}
            >
            {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
            ))}
            </Pie>
        </PieChart>

        {/* legend (so its obvious what colors mean) */}
        <Group gap="md">
            <LegendItem color={COLORS[0]} label="Positive" />
            <LegendItem color={COLORS[1]} label="Neutral" />
            <LegendItem color={COLORS[2]} label="Negative" />
        </Group>
        </Stack>

      <div>
        <Text fw={800} size="xl">
          {total.toLocaleString()}
        </Text>
        <Text size="sm" c="dimmed">
          posts in window
        </Text>
        <Text size="xs" c="dimmed">
          Pos {pct(pos)}% · Neu {pct(neu)}% · Neg {pct(neg)}%
        </Text>
      </div>
    </Group>
  );
}

