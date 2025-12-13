import pandas as pd
import os

# keeping all paths here in one place so it’s easy to tweak later
PHRASEBANK_PATH = os.path.join("data", "combined_train.csv")  # financial news (PhraseBank dataset) (kaggle)
STOCK_PATH      = os.path.join("data", "stock_clean.csv")     # cleaned stock market sentiment dataset(kaggle)
WSB_PATH        = os.path.join("data", "wsb_clean.csv")       # cleaned reddit WSB comments (kaggle)

OUT_PATH        = os.path.join("data", "all_combined_train.csv") # Combined output file of all 3 datasets


def load_dataset(path, source_name):
    """
    Small helper so I load each dataset in the same way and can track where it came from.
    Im also adding a 'source' column so later I can analyse performance per-source if needed.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found: {path}")

    df = pd.read_csv(path)

    # Testing, I expect every cleaned dataset to have exactly these two columns.
    expected_cols = {"text", "label"}
    if not expected_cols.issubset(df.columns):
        raise ValueError(f"{path} does not have the expected columns {expected_cols}")

    df["source"] = source_name
    return df


def main():
    # Load each cleaned dataset
    phrase_df = load_dataset(PHRASEBANK_PATH, "phrasebank")
    stock_df  = load_dataset(STOCK_PATH, "stock")
    wsb_df    = load_dataset(WSB_PATH, "wsb")

    print("PhraseBank rows:", len(phrase_df))
    print("Stock dataset rows:", len(stock_df))
    print("WSB dataset rows:", len(wsb_df))

    # Concatenate them into one big training set
    all_df = pd.concat([phrase_df, stock_df, wsb_df], ignore_index=True)

    # Quick sanity clean = drop empty texts and normalise labels
    all_df["text"] = all_df["text"].astype(str).str.strip()
    all_df["label"] = all_df["label"].astype(str).str.lower().str.strip()
    all_df = all_df[all_df["text"] != ""]
    all_df = all_df[all_df["label"].isin(["positive", "negative", "neutral"])]

    print("Total rows after merge & clean:", len(all_df))
    print(all_df["label"].value_counts())

    # only keeping text + label for the actual model training
    # Testing, The 'source' column is nice to have for analysis if needed later but not strictly needed for the classifier
    all_df[["text", "label"]].to_csv(OUT_PATH, index=False)
    print(f"✅ Saved merged training dataset to {OUT_PATH}")


if __name__ == "__main__":
    main()