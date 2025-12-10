import pandas as pd
import os

RAW_PATH = os.path.join("data", "all-data.csv")
OUT_PATH = os.path.join("data", "combined_train.csv")

def main():
    # Kaggle file has columns: sentiment, text
    df = pd.read_csv(
        RAW_PATH,
        header=None,
        names=["label", "text"],
        encoding="latin1"
    )
    
    df = df.dropna(subset=["text", "label"])
    df["label"] = df["label"].str.strip().str.lower()
    df = df[df["label"].isin(["positive", "negative", "neutral"])]
    df = df[["text", "label"]]

    print(df.head())
    print("Total rows after cleaning:", len(df))

    df.to_csv(OUT_PATH, index=False)
    print(f"Saved cleaned dataset to {OUT_PATH}")

if __name__ == "__main__":
    main()