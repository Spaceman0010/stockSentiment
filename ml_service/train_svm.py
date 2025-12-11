# ml_service/train_svm.py
"""
Train an SVM sentiment model on the combined financial + Reddit dataset.

Input:
    data/combined_train.csv   -> columns: text,label
    model/vectorizer_lr.pkl   -> TF-IDF vectoriser trained earlier in train_lr.py

Output:
    model/svm_model.pkl       -> trained Linear SVM classifier
"""

import os
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.svm import LinearSVC
from sklearn.metrics import classification_report, accuracy_score
import joblib  # for saving/loading model objects to/from disk


# Paths / constants 

DATA_PATH = os.path.join("data", "all_train.csv")
MODEL_DIR = "model"

# here I'm reusing the same TF-IDF vectoriser that I trained in train_lr.py
VEC_PATH = os.path.join(MODEL_DIR, "vectorizer_lr.pkl")
SVM_MODEL_PATH = os.path.join(MODEL_DIR, "svm_model.pkl")


def main():
    # Making sure the model directory exists
    os.makedirs(MODEL_DIR, exist_ok=True)

    # 1. Loading up the cleaned training data
    df = pd.read_csv(DATA_PATH)
    print("Loaded dataset (raw):", df.shape)  # (n_rows, 2)

    # small sanity cleaning
    df = df.dropna(subset=["text", "label"])
    df["text"] = df["text"].astype(str)
    df["label"] = df["label"].astype(str).str.lower()

    print("After cleaning:", df.shape)
    print("Label distribution:\n", df["label"].value_counts())

    # X = input texts, y = labels
    X = df["text"]
    y = df["label"]

    # 2. Train/test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,        # 20% test set
        random_state=42,      # reproducible split
        stratify=y            # keep class distribution similar in train & test
    )

    # 3. Text → numeric features using the SAME TF-IDF vectoriser as LR
    # I am not re-fitting a new vectoriser here, I just reuse the one from train_lr.py
    # so that LR and SVM both operate in exactly the same feature space.
    print(f"\nLoading existing TF-IDF vectoriser from: {VEC_PATH}")
    vectorizer = joblib.load(VEC_PATH)

    # Use the same vocabulary to transform train and test data
    X_train_vec = vectorizer.transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # 4. Define and train the SVM classifier
    # Using LinearSVC because it's a good fit for high-dimensional text features
    svm_clf = LinearSVC()

    print("\nTraining SVM model...")
    svm_clf.fit(X_train_vec, y_train)

    # 5. Evaluate on the test set
    y_pred = svm_clf.predict(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    print(f"\nSVM Accuracy: {acc:.4f}")

    # Detailed breakdown per class: precision, recall, F1
    print("\nSVM classification report:")
    print(classification_report(y_test, y_pred))

    # 6. Save the trained SVM model as a .pkl file
    joblib.dump(svm_clf, SVM_MODEL_PATH)
    print(f"\nSaved SVM model to {SVM_MODEL_PATH}")


if __name__ == "__main__":
    main()