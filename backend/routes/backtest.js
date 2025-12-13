const express = require('express');
const router = express.Router();

// using these to read CSV files from disk
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// CSV path
const DATA_FOLDER = path.join(__dirname, '..', '..', 'ml_service', 'data');

// Map model -> file name
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

// Convert numeric direction into UI friendly text
function dirToText(v) {
  if (Number(v) === 1) return 'UP';
  if (Number(v) === -1) return 'DOWN';
  return 'NEUTRAL';
}

// Read CSV fully
function readCsvRows(csvPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csvPath)) {
      return reject(new Error(`CSV not found at: ${csvPath}`));
    }

    const rows = [];
    fs.createReadStream(csvPath)
      .pipe( csv({mapHeaders: ({ header }) => String(header || "").replace(/^\uFEFF/, "").trim(),})) // update: i strip BOM + spaces from CSV headers so keys become normal ("date", not "﻿date")
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
}

// GET /api/backtest/rows?model=lr&ticker=TSLA&start=2022-04-01&end=2022-12-31
router.get('/rows', async (req, res) => {
  try {
    const { model, ticker, start, end } = req.query;

    const filename = getCsvFilenameFromModel(model);
    if (!filename) {
      return res.status(400).json({ error: `Unknown model: ${model}` });
    }

    const csvPath = path.join(DATA_FOLDER, filename);
    const rawRows = await readCsvRows(csvPath);
    // i do this because sometimes CSV headers have hidden characters and "date" becomes weird
    const dateKey = rawRows?.[0]?.date ? "date" : Object.keys(rawRows?.[0] || {}).find((k) => k.toLowerCase().includes("date"));

    // update: if i cannot find any date column, filtering will return empty rows, so i fail fast
    if (!dateKey) {
    return res.status(500).json({
        error: "Could not find a date column in the CSV",
        hint: "Check CSV headers; expected something like 'date'",
        keys: Object.keys(rawRows?.[0] || {}),
    });
    }

    // update: i print 1 sample so i can see exactly what date key/value i am parsing
    console.log("DEBUG backtest rows: dateKey =", dateKey);
    console.log("DEBUG backtest rows: raw[dateKey] =", rawRows?.[0]?.[dateKey]);
    console.log("DEBUG backtest rows: iso =", ddmmyyToIso(rawRows?.[0]?.[dateKey]));

    const t = String(ticker || '').toUpperCase();

    // updated comments
    // step 1: filter ticker if it exists
    const tickerFiltered = t
      ? rawRows.filter((r) => String(r.ticker || '').toUpperCase() === t)
      : rawRows;

    // step 2: filter by date window (using ISO date conversion)
    const dateFiltered =
      start && end
        ? tickerFiltered.filter((r) => {
            const iso = ddmmyyToIso(r[dateKey]);
            return iso >= start && iso <= end;
          })
        : tickerFiltered;

    // now map CSV columns -> frontend table columns
    const predCol = `${model}_pred_dir`;
    const correctCol = `${model}_correct`;
    const scoreCol = `${model}_mean_score`;

    const rows = dateFiltered.map((r) => ({
      date: ddmmyyToIso(r[dateKey]),
      ticker: String(r.ticker || '').toUpperCase(),
      pred: dirToText(r[predCol]),
      real: dirToText(r.real_dir),
      correct: Number(r[correctCol] || 0) === 1,
      conf: Number(r[scoreCol] || 0),
    }));

    res.json({ rows });
  } catch (err) {
    console.error('❌ backtest/rows failed:', err.message);
    res.status(500).json({ error: 'Failed to load backtest CSV rows', details: err.message });
  }
});

// ✅ POST /api/backtest/run
// For now: same as rows (reads CSV again). Later: trigger python run(if i get time)
router.post('/run', async (req, res) => {
  try {
    const { model, ticker, start, end } = req.body;

    const filename = getCsvFilenameFromModel(model);
    if (!filename) {
      return res.status(400).json({ error: `Unknown model: ${model}` });
    }

    const csvPath = path.join(DATA_FOLDER, filename);
    const rawRows = await readCsvRows(csvPath);
     // i do this because sometimes CSV headers have hidden characters and "date" becomes weird
    const dateKey = rawRows?.[0]?.date ? "date" : Object.keys(rawRows?.[0] || {}).find((k) => k.toLowerCase().includes("date"));

    // update: if i cannot find any date column, filtering will return empty rows, so i fail fast
    if (!dateKey) {
    return res.status(500).json({
        error: "Could not find a date column in the CSV",
        hint: "Check CSV headers; expected something like 'date'",
        keys: Object.keys(rawRows?.[0] || {}),
    });
    }

    const t = String(ticker || '').toUpperCase();

    const tickerFiltered = t
      ? rawRows.filter((r) => String(r.ticker || '').toUpperCase() === t)
      : rawRows;

    const dateFiltered =
      start && end
        ? tickerFiltered.filter((r) => {
            const iso = ddmmyyToIso(r[dateKey]);
            return iso >= start && iso <= end;
          })
        : tickerFiltered;

    const predCol = `${model}_pred_dir`;
    const correctCol = `${model}_correct`;
    const scoreCol = `${model}_mean_score`;

    const rows = dateFiltered.map((r) => ({
      date: ddmmyyToIso(r[dateKey]),
      ticker: String(r.ticker || '').toUpperCase(),
      pred: dirToText(r[predCol]),
      real: dirToText(r.real_dir),
      correct: Number(r[correctCol] || 0) === 1,
      conf: Number(r[scoreCol] || 0),
    }));

    res.json({ rows });
  } catch (err) {
    console.error('❌ backtest/run failed:', err.message);
    res.status(500).json({ error: 'Failed to run backtest (CSV read)', details: err.message });
  }
});

module.exports = router;