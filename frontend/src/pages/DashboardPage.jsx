// update: this page is my kinda "one screen answer everything" page
// hre i show:
// 1) Scale cards
// 2) Model comparison table
// 3) Sentiment donut

import React, { useEffect, useState } from "react";
import { Paper, SimpleGrid, Text, Group, Badge, Stack, Divider } from "@mantine/core";
import { fetchDashboardSummary } from "../api/dashboard";
import ModelComparisonTable from "../components/ModelComparisonTable";
import SentimentDonut from "../components/SentimentDonut";
import WindowSummaryCards from "../components/WindowSummaryCards";

// fallback demo data so the UI never looks empty during development
const FALLBACK = {
  window: { start: "2022-03-01", end: "2022-08-31" },
  tickers: ["TSLA", "AAPL", "MSFT", "NVDA", "AMD", "GME"],
  postsAnalyzed: 7266,
  daysEvaluated: 528,
  modelComparison: [
    { model: "lr", directionalAccuracy: 0.333, evaluatedDays: 528, avgConfidence: 0.61, avgLatencyMs: 4 },
    { model: "svm", directionalAccuracy: 0.347, evaluatedDays: 528, avgConfidence: 0.64, avgLatencyMs: 6 },
    { model: "distilbert", directionalAccuracy: 0.402, evaluatedDays: 528, avgConfidence: 0.69, avgLatencyMs: 55 },
  ],
  sentimentDistribution: {
    lr: { pos: 2100, neu: 3700, neg: 1466 },
    svm: { pos: 1900, neu: 4000, neg: 1366 },
    distilbert: { pos: 2400, neu: 3300, neg: 1566 },
  },
};

export default function DashboardPage({ selectedModel }) {
  const [data, setData] = useState(FALLBACK);
  const [loading, setLoading] = useState(false);

  // when this page loads, try to fetch real data from backend
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        const real = await fetchDashboardSummary();
        if (!ignore && real) setData(real);
      } catch (err) {
        // if incase backend fails, just keep fallback data so demo doesnt break
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Pick the distribution for the currently selected model
  const dist =
    data?.sentimentDistribution?.[selectedModel] ||
    FALLBACK.sentimentDistribution[selectedModel];

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={800} size="xl">
          Dashboard
        </Text>

        <Badge variant="light" color="gray">
          Model: {selectedModel.toUpperCase()} {loading ? "(loading…)" : ""}
        </Badge>
      </Group>

      <WindowSummaryCards
        start={data.window?.start}
        end={data.window?.end}
        tickersCount={data.tickers?.length || 0}
        postsAnalyzed={data.postsAnalyzed}
        daysEvaluated={data.daysEvaluated}
      />

        <Paper p="md" radius="md" withBorder>
        <Group justify="space-between">
          <Text fw={700}>Directional accuracy (selected model)</Text>

          <Badge variant="light" color="gray">
            {(() => {
              const m = (data.modelComparison || []).find((x) => x.model === selectedModel);
              const acc = (m?.directionalAccuracy || 0) * 100;
              return `${acc.toFixed(1)}%`;
            })()}
          </Badge>
        </Group>

        <Text size="xs" c="dimmed" mt="xs">
          Next-day direction accuracy from backtest CSV for {selectedModel.toUpperCase()}.
        </Text>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={700}>Model comparison (backtest summary)</Text>
            <Badge variant="light" color="gray">
              {loading ? "Loading…" : "Ready"}
            </Badge>
          </Group>

          <ModelComparisonTable rows={data.modelComparison || []} />
        </Paper>

        <Paper p="md" radius="md" withBorder mih={320}>
          <Text fw={700} mb="sm">
            Sentiment distribution
          </Text>
          
            <div style={{ minHeight: 240 }}>
                <SentimentDonut pos={dist?.pos || 0} neu={dist?.neu || 0} neg={dist?.neg || 0} />
            </div>    

          <Divider my="sm" />

          <Text size="xs" c="dimmed">
            This distribution is across the dataset window for the selected model.
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}