// update: these cards are quick project scale proof
// they answer: window, tickers count, posts count, etc.

import React from "react";
import { SimpleGrid, Paper, Text } from "@mantine/core";

function MiniCard({ label, value, hint }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Text size="sm" c="dimmed">
        {label}
      </Text>

      <Text fw={800} size="xl">
        {value}
      </Text>

      {hint ? (
        <Text size="xs" c="dimmed">
          {hint}
        </Text>
      ) : null}
    </Paper>
  );
}

export default function WindowSummaryCards({
  start,
  end,
  tickersCount,
  postsAnalyzed,
  daysEvaluated,
}) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3, lg: 5 }} spacing="md">
      <MiniCard label="Window" value={`${start} → ${end}`} hint="Fixed demo window" />
      <MiniCard label="Tickers" value={tickersCount} hint="Tracked symbols" />
      <MiniCard
        label="Posts analysed"
        value={(postsAnalyzed ?? 0).toLocaleString()}
        hint="WSB dataset"
      />
      <MiniCard
        label="Days evaluated"
        value={(daysEvaluated ?? 0).toLocaleString()}
        hint="Backtest rows"
      />
      <MiniCard label="Task" value="3-way sentiment" hint="POS / NEU / NEG" />
    </SimpleGrid>
  );
}