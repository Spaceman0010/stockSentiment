// src/App.js
// This file is the "main layout" of my app.
// It contains:
// - Top header
// - Left sidebar (navigation + controls)
// - Main content area (Dashboard / Backtesting / Settings)

import React, { useMemo, useState } from "react";
import {
  AppShell,
  Group,
  Text,
  NavLink,
  Container,
  Select,
  Button,
  Badge,
  Divider,
  Stack,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconChartLine, IconGauge, IconSettings } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

//import { fetchDashboardSummary } from "./api/dashboard"; //update 
import DashboardPage from "./pages/DashboardPage";
import BacktestingPage from "./pages/BacktestingPage";
import SettingsPage from "./pages/SettingsPage";

const MODELS = [
  { value: "lr", label: "Logistic Regression (LR)" },
  { value: "svm", label: "SVM" },
  { value: "distilbert", label: "DistilBERT" },
];

const TICKERS = ["TSLA", "AAPL", "MSFT", "NVDA", "AMD", "GME"].map((t) => ({
  value: t,
  label: t,
}));

// update: mantine can sometimes give Date-like values, so i normalize it into a real JS Date
function normalizeToDate(d) {
  if (!d) return null;

  if (d instanceof Date && !isNaN(d.getTime())) return d;

  if (typeof d === "string" || typeof d === "number") {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  if (typeof d === "object" && typeof d.toDate === "function") {
    const converted = d.toDate();
    if (converted instanceof Date && !isNaN(converted.getTime())) return converted;
  }

  return null;
}

export default function App() {
  // I store which page the user is viewing.
  const [activePage, setActivePage] = useState("dashboard");

  // I store my current selected model + ticker + date window.
  const [model, setModel] = useState("lr");
  const [ticker, setTicker] = useState("TSLA");
  const [range, setRange] = useState([
    new Date("2022-04-01"),
    new Date("2022-12-31"),
  ]);

  //const [rangeDraft, setRangeDraft] = useState(range);

  // update: date picker can be half-selected like [Date, null], so i guard it properly
  const start = useMemo(() => {
    const d0 = normalizeToDate(range?.[0]);
    if (!d0) return "";
    return d0.toISOString().slice(0, 10);
  }, [range]);

  // update: same guard for end date
  const end = useMemo(() => {
    const d1 = normalizeToDate(range?.[1]);
    if (!d1) return "";
    return d1.toISOString().slice(0, 10);
  }, [range]);

  // update: I store the real dashboard summary from backend here (so I can show real metrics)
  /*
  const [summary, setSummary] = useState(null);
    useEffect(() => {
    // I fetch real dashboard numbers once when the app loads
    async function loadSummary() {
      try {
        const data = await fetchDashboardSummary();
        setSummary(data);
      } catch (err) {
        // If backend is down, I just log it and the UI can keep showing dummy numbers
        console.error("❌ Failed to load dashboard summary:", err);
      }
    }

    loadSummary();
  }, []);
  */

  function handleGlobalRunClick() {
    // This button just shows a popup so demo feels alive.
    // Backtesting page has the real run button that calls backend.
    notifications.show({
      title: "Run requested",
      message: `Model=${model.toUpperCase()} | Ticker=${ticker} | ${start} → ${end}`,
    });

    // I auto-switch to Backtesting page because that’s where the run happens.
    setActivePage("backtesting");
  }

  //console.log("DEBUG range:", range, "start:", start, "end:", end); //debug line testing

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 280, breakpoint: "sm" }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <IconChartLine size={20} />
            <Text fw={700}>StockSentiment Dashboard</Text>
            <Badge variant="light">MSc Demo</Badge>
          </Group>

          <Badge color="gray" variant="light">
            Model: {model.toUpperCase()}
          </Badge>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
            Navigation
          </Text>

          <NavLink
            label="Dashboard"
            leftSection={<IconGauge size={18} />}
            active={activePage === "dashboard"}
            onClick={() => setActivePage("dashboard")}
          />

          <NavLink
            label="Backtesting"
            leftSection={<IconChartLine size={18} />}
            active={activePage === "backtesting"}
            onClick={() => setActivePage("backtesting")}
          />

          <NavLink
            label="Settings"
            leftSection={<IconSettings size={18} />}
            active={activePage === "settings"}
            onClick={() => setActivePage("settings")}
          />

          <Divider my="sm" />

          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
            Controls
          </Text>

          <Select
            label="Model"
            data={MODELS}
            value={model}
            onChange={(v) => setModel(v || "lr")}
            allowDeselect={false}
          />

          <Select
            label="Ticker"
            data={TICKERS}
            value={ticker}
            onChange={(v) => setTicker(v || "TSLA")}
            searchable
            allowDeselect={false}
          />

          <DatePickerInput
            type="range"
            label="Backtest window"
            value={range}
            onChange={setRange}
            clearable={false}
            minDate={new Date("2022-04-01")}
            maxDate={new Date("2022-12-31")}
          />

          {/* update: this shows me what dates the app is actually using (so demo never feels buggy) */}
          <Text size="xs" c="dimmed">
          Selected range: {start && end ? `${start} → ${end}` : "Pick BOTH start and end date"}
          </Text>

          <Button fullWidth mt="sm" onClick={handleGlobalRunClick}>
            Go to Backtesting 
          </Button>

          <Text size="xs" c="dimmed">
            Tip: Backtest window is 1st April 2022 to 31st December 2022
          </Text>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl">
          {activePage === "dashboard" && <DashboardPage selectedModel={model} />}

          {activePage === "backtesting" && (
            <BacktestingPage model={model} ticker={ticker} start={start} end={end} />
          )}

          {activePage === "settings" && <SettingsPage />}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}