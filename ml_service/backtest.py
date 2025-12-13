# updating and adding comments throughout 
"""
Backtesting reddit sentiment vs next day stock movement (using WallStreetBets 2022 discussions dataset)
im selecting time window: March 1, 2022 -> August 31, 2022

High level idea (in simplified):
1) Load WSB posts from CSV
2) Keep only rows in my date range
3) Detect if the row talks about EXACTLY ONE ticker (TSLA/AAPL/MSFT/NVDA/AMD/GME) (important)
    - If it talks about multiple tickers, i skip it (just less confusion later on)
4) Send those texts to my ML service (/predict) to get sentiment
5) Aggregate sentiment per ticker per day
6) Pull real stock prices and compare sentiment direction vs next day return direction
"""

import os
import re
import time
import requests
import pandas as pd
import yfinance as yf #using yahooFinance api to pull actual real world stock prices on given date


# -----------------------------
# Config (testing)(easy to tweak later)
# -----------------------------

DATA_PATH = os.path.join("data", "wallstreetbets_2022.csv")   #input file path

# my backtesting window
START_DATE = "2022-04-01"
END_DATE   = "2022-12-31"

# tickers I want to backtest (using these tickers because they have high interest from users and are highly discussed so they have more number of posts)
TICKERS = ["TSLA", "AAPL", "MSFT", "NVDA", "AMD", "GME"]

# where my Flask ML service is running
ML_URL = "http://localhost:5051/predict"

# which ML models i want to compare, 
# (running all 3 models at once would be resource intensive so im running only LR to if everything is good)
MODELS = ["distilbert"]

# (update) to keep memory stable, I read CSV in chunks
CHUNK_SIZE = 100_000

# how many texts to send per API call (safe + fast) (will tweak if any issues occur)
BATCH_SIZE = 64

# ---------------------------------------
# 1: building ticker regex patterns
# ---------------------------------------
# I want to catch all variations of a certain ticker like:
# "TSLA", "$TSLA", "Tesla", "TESLA"
# and same for other tickers 

    #it basically returns a dict like:{"TSLA": compiled_regex_for_tsla,}

def build_ticker_patterns():

    patterns = {}

    for t in TICKERS:
        if t == "TSLA":
            words = ["TSLA", "$TSLA", "TESLA", "Tesla", "tesla"]
        elif t == "AAPL":
            words = ["AAPL", "$AAPL", "APPLE", "Apple", "apple"]
        elif t == "MSFT":
            words = ["MSFT", "$MSFT", "MICROSOFT", "Microsoft", "microsoft"]
        elif t == "NVDA":
            words = ["NVDA", "$NVDA", "NVIDIA", "Nvidia", "nvidia"]
        elif t == "AMD":
            words = ["AMD", "$AMD", "Advanced Micro Devices", "advanced micro devices"]
        elif t == "GME":
            words = ["GME", "$GME", "GAMESTOP", "GameStop", "Gamestop", "gamestop"]
        else:
            words = [t, f"${t}"]

        # joining them in one single regex entry: (TSLA|\$TSLA|TESLA|Tesla|tesla)
        joined = "|".join([re.escape(w) for w in words])
        regex = re.compile(rf"(\b{joined}\b)", flags=re.IGNORECASE)     # \b makes it act like "word boundary" to reduce false matches

        patterns[t] = regex

    return patterns

TICKER_PATTERNS = build_ticker_patterns()


# ---------------------------------------------------
# 2: figuring out which ticker a text mentions
# ---------------------------------------------------

    #basic concept is it returns a list of tickers mentioned in this text.
    # Example: "TSLA to the moon" -> ["TSLA"]
    # "TSLA and NVDA are great" -> ["TSLA", "NVDA"]

def detect_tickers_in_text(text: str):
 
    if not isinstance(text, str):
        return []

    found = []
    for ticker, rgx in TICKER_PATTERNS.items():
        if rgx.search(text):
            found.append(ticker)

    return found


# ----------------------------------
# 3: calling my flask ML service for labels
# ----------------------------------
    """
    texts = list of strings
    Returns a list of dicts like:
      [{"label":"positive","score":0.8}, ...]
    """

def predict_sentiment_batch(model_name: str, texts):

    # converting each text into the same format that api expects: {title, body}
    posts = [{"title": t, "body": ""} for t in texts]

    payload = {"model": model_name, "posts": posts}

    resp = requests.post(ML_URL, json=payload, timeout=60)
    resp.raise_for_status()

    data = resp.json()
    return data["predictions"]


# --------------------------------------------
# 4: converting label into a simple up/down direction
# --------------------------------------------
    """
    this is just for the “did it go up or down?” style evaluation
    positive -> +1
    neutral  ->  0
    negative -> -1
    """
def label_to_direction(label: str):

    label = (label or "").lower()
    if label == "positive":
        return 1
    if label == "negative":
        return -1
    return 0


# ---------------------------------------------------------
# 5: main function that runs the backtest from start to finish
# ---------------------------------------------------------

def main():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Could not find dataset: {DATA_PATH}")

    print("1️⃣ 👍 ✅ Loading WSB dataset in chunks...")
    print(f"2️⃣ 👍 ✅ Backtest window: {START_DATE} -> {END_DATE}")
    print(f"3️⃣ 👍 ✅ Tickers: {TICKERS}")
    print(f"4️⃣ 👍 ✅ Models: {MODELS}")

    # This will store all rows that survive filtering
    # columns: date, ticker, text
    rows_kept = []

    # Converting date strings (so we can compare properly)
    start_dt = pd.to_datetime(START_DATE)
    end_dt = pd.to_datetime(END_DATE)

    # Read big ahh CSV in chunks without nuking my RAM
    for chunk in pd.read_csv(DATA_PATH, chunksize=CHUNK_SIZE):
        
        if "timestamp" not in chunk.columns: # using this for basic safety even tho my Kaggle file already has a the column "timestamp" 
            raise ValueError("Expected a 'timestamp' column in the CSV")

        # making sure title and body are always strings (no empty values)
        # some WSB rows store text in "title", others in "body", so im considering both
        chunk["title"] = chunk.get("title", "").fillna("")
        chunk["body"] = chunk.get("body", "").fillna("")

        # combining into one text field
        chunk["text"] = (chunk["title"].astype(str) + " " + chunk["body"].astype(str)).str.strip()

        # Parse timestamp -> datetime
        chunk["dt"] = pd.to_datetime(chunk["timestamp"], errors="coerce")

        # Filter by date range
        chunk = chunk[(chunk["dt"] >= start_dt) & (chunk["dt"] <= end_dt)]

        if chunk.empty:
            continue

        # (testing)reduce to only what we need (keeps things fast)
        for _, r in chunk.iterrows():
            text = r["text"]
            dt = r["dt"]

            # detect which tickers are mentioned?
            tickers_found = detect_tickers_in_text(text)

            # IMPORTANT NOTE: skip if 0 tickers, skip if multiple tickers, maintains clean attribution
            if len(tickers_found) != 1:
                continue

            ticker = tickers_found[0]

            # Convert datetime to -> just a date string "YYYY-MM-DD"
            day = dt.date().isoformat()
            rows_kept.append({"date": day, "ticker": ticker, "text": text})

    df = pd.DataFrame(rows_kept)
    print("\n✅ Rows kept after filtering:", len(df))
    if df.empty:
        print("❌ No rows found in the selected date range. Check the CSV timestamp format.")
        return

    # update: adding these two lines for sanity check
    print("📅 Earliest date kept:", df["date"].min())
    print("📅 Latest date kept:", df["date"].max())

    # ------------------------------------------
    # Step 6A: run predictions for each ML model
    # ------------------------------------------

    # storing latency so i can show it in evaluation
    latency_summary = []

    # for each model, we create sentiment predictions for each text row
    for model_name in MODELS:
        print(f"\n🔁 Running predictions for model: {model_name}")

        preds_label = []
        preds_score = []

        t0 = time.perf_counter()

        # sending texts in batches so API calls are not huge af 
        texts_list = df["text"].tolist()
        for i in range(0, len(texts_list), BATCH_SIZE):
            batch = texts_list[i:i + BATCH_SIZE]
            preds = predict_sentiment_batch(model_name, batch)

            for p in preds:
                preds_label.append(p["label"])
                preds_score.append(float(p["score"]))

        t1 = time.perf_counter()

        # Save columns into df
        df[f"{model_name}_label"] = preds_label
        df[f"{model_name}_score"] = preds_score
        df[f"{model_name}_dir"] = df[f"{model_name}_label"].apply(label_to_direction)

        # update: adding this simple latency metric - seconds per item
        sec_per_item = (t1 - t0) / len(texts_list)
        latency_summary.append({"model": model_name, "sec_per_text": sec_per_item})

        print(f"✅ Done. Avg seconds per text: {sec_per_item:.6f}")

    # ----------------------------------------------------
    # Step 6B: aggregate daily sentiment per ticker per model
    # ----------------------------------------------------
    # im trying to do a simple daily average direction:
    #   daily_dir = mean(dir values) -> sign
    #
    # Example:
    # +1, +1, 0, -1 -> mean = 0.25 -> daily signal = +1 (positive leaning)

    daily_rows = []

    grouped = df.groupby(["date", "ticker"])
    for (day, ticker), g in grouped:
        row = {"date": day, "ticker": ticker, "n_posts": len(g)}

        for model_name in MODELS:
            mean_dir = g[f"{model_name}_dir"].mean()

            # Convert mean_dir into final daily signal
            # greater than 0 -> positive, less than 0 -> negative, else neutral
            if mean_dir > 0:
                daily_signal = 1
            elif mean_dir < 0:
                daily_signal = -1
            else:
                daily_signal = 0

            row[f"{model_name}_daily_signal"] = daily_signal
            row[f"{model_name}_mean_score"] = g[f"{model_name}_score"].mean()

        daily_rows.append(row)

    daily_df = pd.DataFrame(daily_rows)
    daily_df["date"] = pd.to_datetime(daily_df["date"])

    print("\n✅ Daily aggregated rows:", len(daily_df))

    # ---------------------------------------------
    # Step 6C: pull up stock prices + compute return on day T+1 
    # ---------------------------------------------

    print("\n🔁 🔁 🔁 Downloading price data from Yahoo Finance (yfinance)...")
    price_start = START_DATE
    # add a few days buffer after END_DATE so T+1 exists
    price_end = (pd.to_datetime(END_DATE) + pd.Timedelta(days=7)).date().isoformat()

    # testing: Download close prices for all tickers at once
    prices = yf.download(
        tickers=" ".join(TICKERS),
        start=price_start,
        end=price_end,
        interval="1d",
        auto_adjust=False,
        progress=False
    )

    # testing; yfinance returns a multi index dataframe when multiple tickers
    # I only need "Close" value, stock price on the closing time
    close = prices["Close"].copy()

    # making sure close is a DataFrame even if yfinance returns series
    if isinstance(close, pd.Series):
        close = close.to_frame()

    # ---------------------------------------------
    # Step 6D: comparing the daily signal vs next-day return
    # ---------------------------------------------

    results = []

    for _, r in daily_df.iterrows():
        day = r["date"]
        ticker = r["ticker"]

        if ticker not in close.columns:
            continue

        # We need close price for day and day+1
        # update: If market closed, day might not exist so -> skip
        if day not in close.index:
            continue

        # this will give the next trading day (not necessarily day+1 calendar day)
        try:
            idx = close.index.get_loc(day)
        except KeyError:
            continue

        if idx + 1 >= len(close.index):
            continue

        next_day = close.index[idx + 1]

        c0 = float(close.loc[day, ticker])
        c1 = float(close.loc[next_day, ticker])

        # Real next day movement direction
        # up = +1, down = -1, flat = 0
        if c1 > c0:
            real_dir = 1
        elif c1 < c0:
            real_dir = -1
        else:
            real_dir = 0

        out = {
            "date": day.date().isoformat(),
            "next_trading_day": next_day.date().isoformat(),
            "ticker": ticker,
            "close_t": c0,
            "close_t1": c1,
            "real_dir": real_dir,
            "n_posts": int(r["n_posts"]),
        }

        # Compare each model
        for model_name in MODELS:
            pred_dir = int(r[f"{model_name}_daily_signal"])

            # Correct if both directions match exactly
            # Note: (I can loosen this rule later, keeping this for testing right now)
            correct = 1 if pred_dir == real_dir else 0

            out[f"{model_name}_pred_dir"] = pred_dir
            out[f"{model_name}_correct"] = correct
            out[f"{model_name}_mean_score"] = float(r[f"{model_name}_mean_score"])

        results.append(out)

    res_df = pd.DataFrame(results)
    if res_df.empty:
        print("❌ No backtest rows matched trading days. Check timestamps vs market dates.")
        return

    # ---------------------------------------------
    # Step 6E: print summary metrics 
    # ---------------------------------------------
    # adding extra step, good for showing metrics 

    print("\n================🔥 BACKTEST SUMMARY 🔥================")
    print("Rows evaluated:", len(res_df))

    for model_name in MODELS:
        acc = res_df[f"{model_name}_correct"].mean()
        print(f"\n✅ {model_name} directional accuracy: {acc:.4f}")

    print("\n================⌛️ LATENCY SUMMARY ⌛️================")
    for item in latency_summary:
        print(f"✅ {item['model']} sec_per_text = {item['sec_per_text']:.6f}")

    # ---------------------------------------------
    # Update: Step 6F: saving outputs so I can screenshot for report 
    # ---------------------------------------------

    out_path = os.path.join("data", "backtest_results_distilbert_apr_dec_2022.csv")
    res_df.to_csv(out_path, index=False)
    print(f"\n✅ Saved backtest results to: {out_path}")


if __name__ == "__main__":
    main()