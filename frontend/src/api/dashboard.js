// Update: comments
// this file contains ONLY dashboard related API calls.
// so my components stay clean and just say "get me dashboard data"

import { api } from "./client";

export async function fetchDashboardSummary() {
      const res = await api.get("/api/dashboard/summary");
  return res.data;
}
  // backend should return an object like:
  // {
  //   window: { start: "2022-04-01", end: "2022-12-31" },
  //   tickers: ["TSLA","AAPL"...],
  //   postsAnalyzed: 7266,
  //   daysEvaluated: 528,
  //   modelComparison: [
  //     { model:"lr", directionalAccuracy:0.33, evaluatedDays:528, avgConfidence:0.61, avgLatencyMs:4 }
  //   ],
  //   sentimentDistribution: {
  //     lr:{ pos:2100, neu:3700, neg:1466 },
  //     svm:{ ... },
  //     distilbert:{ ... }
  //   }
  // }

