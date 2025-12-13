// I use this route to power my Dashboard page.
// This file reads my backtest CSVs and returns values

const express = require('express');
const router = express.Router();

// using these to read CSV files from disk
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// My CSV files are in ml_service/data/
const DATA_FOLDER = path.join(__dirname, '..', '..', 'ml_service', 'data');

// this maps frontend model keys to CSV filenames
function getCsvFilenameFromModel(model) {
  if (model === 'lr') return 'backtest_results_LR_apr_dec_2022.csv';
  if (model === 'svm') return 'backtest_results_svm_apr_dec_2022.csv';
  if (model === 'distilbert') return 'backtest_results_distilbert_apr_dec_2022.csv';
  return null;
}

// Convert dates into "YYYY-MM-DD" so filtering/sorting is easy
// My CSV used to be "01/04/22" (DD/MM/YY) BUT now it's "2022-04-01" (ISO)
// so i support BOTH formats here
function ddmmyyToIso(d) {
  const s = String(d || "").trim();
  if (!s) return "";

  // if it's already ISO like "2022-04-01", just return the date part
  if (s.includes("-")) return s.slice(0, 10);

  // otherwise assume it's "DD/MM/YY"
  const parts = s.split("/");
  if (parts.length !== 3) return "";

  const dd = parts[0].padStart(2, "0");
  const mm = parts[1].padStart(2, "0");
  const yy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];

  return `${yy}-${mm}-${dd}`;
}

// simple CSV reader: returns ALL rows as objects (strings)
function readCsvRows(csvPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csvPath)) {
      return reject(new Error(`CSV not found at: ${csvPath}`));
    }

    const rows = [];
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
}

// GET route /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    // loading all 3 CSV so I can make a comparison table
    const models = ['lr', 'svm', 'distilbert'];

    const modelData = {};

    for (const m of models) {
      const filename = getCsvFilenameFromModel(m);
      if (!filename) continue;

      const csvPath = path.join(DATA_FOLDER, filename);
      const rows = await readCsvRows(csvPath);

      modelData[m] = rows;
    }

    // using LR file as the "base" to get tickers/window/posts etc (all files share same structure)
    const baseRows = modelData.lr || [];

    const tickers = Array.from(
      new Set(baseRows.map((r) => String(r.ticker || '').toUpperCase()).filter(Boolean))
    );

    const isoDates = baseRows.map((r) => ddmmyyToIso(r.date)).filter(Boolean);
    isoDates.sort();

    const windowStart = isoDates.length ? isoDates[0] : '2022-04-01';
    const windowEnd = isoDates.length ? isoDates[isoDates.length - 1] : '2022-12-31';

    // postsAnalyzed = total number of posts included in aggregation
    // I sum n_posts across rows (this is more honest than counting rows)
    const postsAnalyzed = baseRows.reduce((sum, r) => sum + Number(r.n_posts || 0), 0);
    
    // rows evaluated = how many ticker days were evaluated
    const rowsEvaluated = baseRows.length;

    // build comparison rows for the dashboard table
    const modelComparison = models.map((m) => {
      const rows = modelData[m] || [];

      // column names differ per model, so I build them here
      const correctCol = `${m}_correct`;
      const scoreCol = `${m}_mean_score`;

      // directional accuracy = mean(correct)
      const correctMean =
        rows.length
          ? rows.reduce((sum, r) => sum + Number(r[correctCol] || 0), 0) / rows.length
          : 0;

      // avg confidence = mean(mean_score)
      const scoreMean =
        rows.length
          ? rows.reduce((sum, r) => sum + Number(r[scoreCol] || 0), 0) / rows.length
          : 0;

      // latency is NOT inside this CSV, so I put 0 for now (I will wire python stats later)
      const avgLatencyMs = 0;

      return {
        model: m,
        directionalAccuracy: Number(correctMean.toFixed(6)),
        evaluatedDays: rows.length,
        avgConfidence: Number(scoreMean.toFixed(6)),
        avgLatencyMs,
      };
    });

    // update: Sentiment distribution (for donut)
    // My CSV is directional (-1 / 0 / 1), so I treat that as:
    // -1 = Negative/Down, 0 = Neutral, 1 = Positive/Up
    // weighted by n_posts so it reflects volume properly
    const sentimentDistribution = {};

    for (const m of models) {
      const rows = modelData[m] || [];
      const predCol = `${m}_pred_dir`;

      let pos = 0;
      let neu = 0;
      let neg = 0;

      for (const r of rows) {
        const w = Number(r.n_posts || 1); // weight by post count
        const v = Number(r[predCol]);

        if (v === 1) pos += w;
        else if (v === 0) neu += w;
        else if (v === -1) neg += w;
      }

      sentimentDistribution[m] = { pos, neu, neg };
    }

    res.json({
      window: { start: windowStart, end: windowEnd },
      tickers,
      postsAnalyzed,
      daysEvaluated: rowsEvaluated,
      modelComparison,
      sentimentDistribution,
    });
  } catch (err) {
    console.error('❌ dashboard/summary failed:', err.message);
    res.status(500).json({ error: 'Failed to build dashboard summary', details: err.message });
  }
});

module.exports = router;

