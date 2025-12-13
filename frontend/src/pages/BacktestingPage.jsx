// update: this page is my drill down page
// it shows the actual rows from csv (date, predicted, actual, confidence)
// later i can also add charts here

import React, { useEffect, useMemo, useState } from "react";
import { Paper, Group, Text, Badge, Table, Button, Stack } from "@mantine/core";
import { runBacktest, fetchBacktestRows } from "../api/backtest";
import { notifications } from "@mantine/notifications";

// fallback rows so UI always looks alive
const FALLBACK_ROWS = [
  { date: "2022-06-10", ticker: "TSLA", pred: "UP", real: "DOWN", correct: false, conf: 0.74 },
  { date: "2022-06-13", ticker: "TSLA", pred: "DOWN", real: "DOWN", correct: true, conf: 0.77 },
  { date: "2022-06-14", ticker: "TSLA", pred: "NEUTRAL", real: "UP", correct: false, conf: 0.62 },
];

export default function BacktestingPage({ model, ticker, start, end }) {
  const [rows, setRows] = useState(FALLBACK_ROWS);
  const [loading, setLoading] = useState(false);

  // compute accuracy from whatever rows i currently have
  const accuracy = useMemo(() => {
    const correctCount = rows.filter((r) => r.correct).length;
    return rows.length ? correctCount / rows.length : 0;
  }, [rows]);

  // When model/ticker/window changes, try to fetch rows from backend.
  useEffect(() => {
    let ignore = false;

    // update: i only fetch when both dates exist, otherwise range selection feels buggy
    if (!start || !end) return;

    async function loadRows() {
      try {
        setLoading(true);
        const data = await fetchBacktestRows({ model, ticker, start, end });

        // I expect backend returns: { rows: [...] }
        if (!ignore) setRows(data?.rows || []);
      } catch (err) {
        // if backend fails, keep fallback rows.
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadRows();
    return () => {
      ignore = true;
    };
  }, [model, ticker, start, end]);

  async function handleRun() {
    // update: if dates are not selected properly, i stop here so demo doesnt look broken
    /* if (!start || !end) {
        notifications.show({
        title: "Select full date range",
        message: "Pick both start and end date first.",
        color: "red",
        });
        return;
    } */
    try {
      setLoading(true);

      notifications.show({
        title: "Running backtest",
        message: `Model=${model.toUpperCase()} | Ticker=${ticker} | ${start} → ${end}`,
      });

      const result = await runBacktest({ model, ticker, start, end });

      // test: expecting backend returns: { rows: [...] }
      setRows(result?.rows || []); //testing

      notifications.show({
        title: "Backtest done",
        message: "Results updated on screen.",
      });
    } catch (err) {
      notifications.show({
        title: "Backtest failed",
        message: "Backend didn’t respond. Using fallback rows for now.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Text fw={800} size="xl">Backtesting</Text>
          <Text size="sm" c="dimmed">
            Drill-down rows for {ticker} using {model.toUpperCase()}
          </Text>
        </div>

        <Badge variant="light" color="gray">
          Accuracy: {(accuracy * 100).toFixed(1)}% {loading ? "(loading…)" : ""}
        </Badge>
      </Group>

      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={700}>Daily results</Text>
          <Button onClick={handleRun} loading={loading} disabled={!start || !end}>
            Run / Refresh
          </Button>
        </Group>

        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Ticker</Table.Th>
              <Table.Th>Predicted</Table.Th>
              <Table.Th>Actual</Table.Th>
              <Table.Th>Correct</Table.Th>
              <Table.Th>Confidence</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {rows.map((r, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>{r.date}</Table.Td>
                <Table.Td>{r.ticker}</Table.Td>
                <Table.Td>{r.pred}</Table.Td>
                <Table.Td>{r.real}</Table.Td>
                <Table.Td>{r.correct ? "YES" : "NO"}</Table.Td>
                <Table.Td>{Number(r.conf).toFixed(2)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        
        {/* update: empty state so date filtering never looks broken */}
        {!loading && rows.length === 0 && (
        <Text mt="sm" size="sm" c="dimmed">
            No rows found for this ticker in the selected date range.
        </Text>
        )}

        <Text mt="sm" size="xs" c="dimmed">
          Next upgrade: fetch full CSV rows + add equity curve + drawdown chart here.
        </Text>
      </Paper>
    </Stack>
  );
}