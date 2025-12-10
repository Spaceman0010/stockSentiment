import pandas as pd
import os

# Paths 
RAW_PATH = os.path.join("data", "wsb-aug-2021-comments.csv") #Input WSB dataset file
OUT_PATH = os.path.join("data", "wsb_clean.csv") #Output file


def map_sentiment(value):
    """
    Map numeric / float sentiment scores to labels,
    similar style to map_sentiment() in preprocess_stock.py.
    """
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None

    if v > 0.1:
        return "positive"
    elif v < -0.1:
        return "negative"
    else:
        return "neutral"


def main():
    # Load raw WSB dataset
    if not os.path.exists(RAW_PATH):
        raise FileNotFoundError(f"Could not find {RAW_PATH}")

    df = pd.read_csv(RAW_PATH)

    # Keep only rows that have text + sentiment
    df = df.dropna(subset=["body", "sentiment"])

    # Creating unified text + label columns (#Test: rewriting this to try and follow other preprocessor structure)
    df["text"] = df["body"].astype(str).str.strip()
    df["label"] = df["sentiment"].apply(map_sentiment)

    # Filter out anything that didn’t map correctly
    before = len(df)
    df = df[df["label"].isin(["positive", "negative", "neutral"])]
    after = len(df)

    # Keep only the final two columns for training
    df = df[["text", "label"]]

    print(df.head())
    print(f"Rows before cleaning: {before}, after cleaning: {after}")

    # Save cleaned dataset
    df.to_csv(OUT_PATH, index=False)
    print(f"✅ Saved cleaned dataset to {OUT_PATH}")


if __name__ == "__main__":
    main()