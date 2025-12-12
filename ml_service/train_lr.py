
import os
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib  # for saving model objects to disk


# Paths 

# Update: now training on the merged dataset (PhraseBank + stock_data + WSB)
DATA_PATH = os.path.join("data", "all_train.csv")
MODEL_DIR = "model"

VEC_PATH = os.path.join(MODEL_DIR, "vectorizer_lr.pkl")
MODEL_PATH = os.path.join(MODEL_DIR, "lr_model.pkl")


def main():
    # Making sure the model directory exists
    os.makedirs(MODEL_DIR, exist_ok=True)

    # 1. Loading up the cleaned training data
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Training data not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print("Loaded dataset (raw):", df.shape)  # (n_rows, n_cols)

    # Basic sanity cleaning so the model only sees valid rows.
    # I’m doing this here as a safety net even though each dataset
    # was pre-cleaned individually.
    df = df.dropna(subset=["text", "label"])
    df["text"] = df["text"].astype(str).str.strip()
    df["label"] = df["label"].astype(str).str.lower().str.strip()

    # Keep only the three target classes
    df = df[df["label"].isin(["positive", "negative", "neutral"])]
    df = df[df["text"] != ""]

    print("After cleaning:", df.shape)
    print("Label distribution:\n", df["label"].value_counts())

    # X = input texts, y = labels
    X = df["text"].astype(str)
    y = df["label"].astype(str)

    # 2. Train/test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,        # 20% test set
        random_state=42,      # reproducible split
        stratify=y            # keep class distribution similar in train & test
    )

    # 3. Text → numeric features using TF-IDF
    # writing down the meaning of these parameters for easier understanding 
    # max_features: cap vocabulary size to 20k most frequent n-grams
    # ngram_range: include unigrams + bigrams (1-gram, 2-gram)
    # stop_words: drop common English stopwords
    
    vectorizer = TfidfVectorizer(
        max_features=20000, 
        ngram_range=(1, 2),
        stop_words="english"
    )

    # Learn vocabulary from training data and transform it
    X_train_vec = vectorizer.fit_transform(X_train)
    # Use the same vocabulary to transform test data
    X_test_vec = vectorizer.transform(X_test)

    # 4. Define and train the Logistic Regression classifier
    clf = LogisticRegression(
        max_iter=400,  # allow more iterations to converge
        n_jobs=-1      # use all CPU cores where possible
    )

    clf.fit(X_train_vec, y_train)

    # 5. Evaluate on the test set
    y_pred = clf.predict(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")

    # Detailed breakdown per class: precision, recall, F1
    print("\nClassification report:")
    print(classification_report(y_test, y_pred))

    # 6. Save the trained vectoriser and model as .pkl files
    joblib.dump(vectorizer, VEC_PATH)
    joblib.dump(clf, MODEL_PATH)

    print(f"\nSaved vectorizer to {VEC_PATH}")
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()