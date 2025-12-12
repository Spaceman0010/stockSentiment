import pandas as pd
from pathlib import Path
import re

# Paths 
RAW_PATH = Path("data/stock_data.csv")      # original Kaggle file
OUT_PATH = Path("data/stock_clean.csv")     # cleaned output file


def clean_text(text: str) -> str:
    """
    Basic text cleaning:
    - ensure string
    - remove extra whitespace
    - strip weird line breaks
    """
    if not isinstance(text, str):
        text = str(text)

    
    text = re.sub(r"\s+", " ", text) # removing extra spaces/newlines
    return text.strip()


def map_sentiment(value):
    """
    Map numeric sentiment to string labels.
    Kaggle uses:
        1 -> positive
        -1 -> negative
        0 -> neutral  (if present)
    Any other values are treated as None and are later dropped.
    """
    try:
        v = int(value)
    except Exception:
        return None

    if v == 1:
        return "positive"
    elif v == -1:
        return "negative"
    elif v == 0:
        return "neutral"
    else:
        return None


def main():
    if not RAW_PATH.exists():
        raise FileNotFoundError(f"Could not find {RAW_PATH}")

    df = pd.read_csv(RAW_PATH) # Reading CSV 

    df.columns = [c.strip() for c in df.columns] # Testing # Normalising column names just in case

    if "Text" not in df.columns or "Sentiment" not in df.columns:
        raise ValueError("Expected columns 'Text' and 'Sentiment' in stock_data.csv")

    # Keep only the columns we need
    df = df[["Text", "Sentiment"]].copy()

    # Cleaning the text
    df["text"] = df["Text"].apply(clean_text)

    df["label"] = df["Sentiment"].apply(map_sentiment)     # This maps numeric sentiment to labels


    # Drop rows with missing or unknown sentiment
    before = len(df)
    df = df.dropna(subset=["text", "label"])
    after = len(df)

    # Keep only the final two columns in correct order
    df_final = df[["text", "label"]]

    print(df_final.head())
    print(f"Rows before cleaning: {before}, after cleaning: {after}")

    # Save cleaned dataset
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df_final.to_csv(OUT_PATH, index=False)
    print(f"✅ Saved cleaned dataset to {OUT_PATH}")


if __name__ == "__main__":
    main()