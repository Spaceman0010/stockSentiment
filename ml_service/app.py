# ml_service/app.py
"""
Flask microservice for sentiment analysis.

Right now it serves ONE model:
- Logistic Regression trained on FinancialPhraseBank
  - vectorizer: model/vectorizer_lr.pkl
  - classifier: model/lr_model.pkl

Endpoint:
    POST /predict
    JSON body:
    {
        "model": "lr",
        "posts": [
            { "title": "...", "body": "..." },
            ...
        ]
    }

Response:
    {
        "model": "lr",
        "predictions": [
            { "label": "positive", "score": 0.81 },
            { "label": "neutral", "score": 0.65 },
            ...
        ]
    }
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

#Flask setup

app = Flask(__name__)
CORS(app)  # allow cross-origin requests (Node / frontend can call this)


# Loading models on startup 

# Adding LR for now, will add other models later

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

LR_VECTORIZER_PATH = os.path.join(MODEL_DIR, "vectorizer_lr.pkl")
LR_MODEL_PATH = os.path.join(MODEL_DIR, "lr_model.pkl")

print("🔁 Loading Logistic Regression model...")

try:
    lr_vectorizer = joblib.load(LR_VECTORIZER_PATH)
    lr_model = joblib.load(LR_MODEL_PATH)
    print("✅ Loaded LR vectorizer and model successfully.")
    print("   Classes:", lr_model.classes_)
except Exception as e:
    print("❌ Failed to load LR model/vectorizer:", e)
    lr_vectorizer = None
    lr_model = None


# Helper for LR predictions 

def predict_with_lr(posts):
    """
    posts: list of dicts like:
        { "title": "...", "body": "..." }

    Returns: list of dicts:
        { "label": str, "score": float }
    """
    if lr_vectorizer is None or lr_model is None:
        raise RuntimeError("LR model not loaded")

    # Building raw text for each post: title + body
    texts = []
    for p in posts:
        title = p.get("title", "") or ""
        body = p.get("body", "") or ""
        text = (str(title) + " " + str(body)).strip()
        texts.append(text if text else " ")  # avoiding empty string edge cases here

    # Vectorise
    X_vec = lr_vectorizer.transform(texts)

    # Get probabilities for each class
    # lr_model.classes_ gives the order of the columns in predict_proba
    if hasattr(lr_model, "predict_proba"):
        probas = lr_model.predict_proba(X_vec)
        class_labels = list(lr_model.classes_)
    else:
        raise RuntimeError("LR model does not support predict_proba") 
        

    predictions = []
    for i in range(X_vec.shape[0]):
        row_probs = probas[i]
        max_idx = row_probs.argmax()
        label = class_labels[max_idx]
        score = float(row_probs[max_idx])

        predictions.append({
            "label": label,
            "score": score
        })

    return predictions


# Routes

@app.route("/", methods=["GET"])
def health_check():
    """Simple health endpoint."""
    return jsonify({"status": "ok", "message": "🔥 Flask ML service is running"})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Main prediction endpoint.

    Expects JSON:
        { "model": "lr", "posts": [...] }

    For now, only "lr" is supported.
    """
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON body"}), 400

    if not data:
        return jsonify({"error": "Missing JSON body"}), 400

    model_name = data.get("model", "lr")
    posts = data.get("posts")

    if not posts or not isinstance(posts, list):
        return jsonify({"error": "Field 'posts' must be a non-empty list"}), 400

    # For now only supporting Logistic Regression
    if model_name != "lr":
        # Later i'll add svm, distilbert
        model_name = "lr"

    try:
        predictions = predict_with_lr(posts)
    except Exception as e:
        print("❌ Error during prediction:", e)
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500

    return jsonify({
        "model": model_name,
        "predictions": predictions
    })


if __name__ == "__main__":
    # Running on port 5051 to match FLASK_API_URL
    port = int(os.environ.get("FLASK_PORT", 5051))
    app.run(host="0.0.0.0", port=port, debug=True)