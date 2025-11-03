# train_model.py
from utils import load_datasets
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib

# 1. Load all text data + labels
texts, labels = load_datasets()

# 2. Split into training and testing sets (80/20)
X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42)

# 3. Convert text into numeric vectors using TF-IDF
vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# 4. Train a Logistic Regression classifier
model = LogisticRegression()
model.fit(X_train_vec, y_train)

# 5. Evaluate performance on test set
y_pred = model.predict(X_test_vec)
print("✅ Accuracy:", accuracy_score(y_test, y_pred))
print("📊 Classification Report:\n", classification_report(y_test, y_pred))

# 6. Save model + vectorizer to disk
joblib.dump(model, 'model/sentiment_model.pkl')
joblib.dump(vectorizer, 'model/vectorizer.pkl')
print("✅ Model and vectorizer saved to /model folder.")