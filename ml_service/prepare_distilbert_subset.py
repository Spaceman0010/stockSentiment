#updating comments for better understanding
"""
Goal: Create a balanced subset of my big combined dataset to use for DistilBERT fine tuning.
Input file :
    data/combined_train.csv (text, label)
Output file :
    data/bert_train.csv (im taking 60k rows -> 20k per class, this is enough for DistilBERT tuning on google colab)
    It should have
        - 20k positive rows
        - 20k neutral rows
        - 20k negative rows
Why:
Bert training works better if classes are roughly balanced
and the dataset is not insanely huge for a first fine tune attempt.
"""

import os
import pandas as pd

# ---- Paths ----
# full one combined merged dataset used for LR/SVM training
FULL_PATH = os.path.join("data", "all_train.csv")

# smaller, balanced dataset only for DistilBERT
OUT_PATH = os.path.join("data", "bert_train.csv")

# how many examples per class I want per class
N_PER_CLASS = 20000


def main():
    # 1. Make sure the source file exists
    if not os.path.exists(FULL_PATH):
        raise FileNotFoundError(f"Could not find input file: {FULL_PATH}")

    # 2. Load the full dataset
    df = pd.read_csv(FULL_PATH)
    print("Loaded full dataset shape:", df.shape)   # (rows, columns)

    # 3. Basic cleaning: ensure columns exist and normalise formats
    #    - text as string
    #    - label as lowercase string
    if "text" not in df.columns or "label" not in df.columns:
        raise ValueError("Expected columns 'text' and 'label' in the CSV")

    df["text"] = df["text"].astype(str)
    df["label"] = df["label"].astype(str).str.strip().str.lower()

    # Keep only the three sentiment classes we care about
    valid_labels = ["positive", "neutral", "negative"]
    df = df[df["label"].isin(valid_labels)]

    print("\nLabel distribution in full dataset:")
    print(df["label"].value_counts())

    # 4. For each label, sample up to N_PER_CLASS rows
    balanced_parts = []

    for label in valid_labels:
        subset = df[df["label"] == label]
        available = len(subset)

        # In case class has fewer than N_PER_CLASS, we just take all of the available rows
        n = min(N_PER_CLASS, available)

        print(f"\nClass '{label}': available = {available}, taking = {n}")
        sampled = subset.sample(n=n, random_state=42)  # random_state for reproducibility

        balanced_parts.append(sampled)

    # 5. Combine all sampled pieces + shuffle
    balanced_df = pd.concat(balanced_parts, ignore_index=True)
    balanced_df = balanced_df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    print("\nFinal balanced dataset shape:", balanced_df.shape)
    print("Final label distribution:")
    print(balanced_df["label"].value_counts())

    # 6. Save to CSV (this is what i'll upload to Colab for DistilBERT)
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    balanced_df.to_csv(OUT_PATH, index=False)

    print(f"\n✅ ✅ ✅ Saved balanced DistilBERT training data to: {OUT_PATH}")

if __name__ == "__main__":
    main()