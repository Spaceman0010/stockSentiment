// this file is ONLY for backtesting related API calls

import { api } from "./client";

export async function runBacktest({ model, ticker, start, end }) {
  // I call my backend to run the backtest (or load csv results)
  const res = await api.post("/api/backtest/run", {
    model,
    ticker,
    start,
    end,
  });

  return res.data;
}

export async function fetchBacktestRows({ model, ticker, start, end }) {
  // calling backend to fetch rows (table data) without re-running everything
  const res = await api.get("/api/backtest/rows", {
    params: { model, ticker, start, end },
  });

  return res.data;
}