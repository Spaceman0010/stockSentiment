#update: Heavily commenting out the file to keep track of everything
"""
Adding this short brief for my own understanding later on,
Flask microservice for sentiment analysis

Update: now now it serves TWO models:
- Logistic Regression("lr")
- Support Vector Machine("svm")

Both models share the same TF-IDF vectoriser:
    - vectorizer: model/vectorizer_lr.pkl
    - LR classifier: model/lr_model.pkl
    - SVM classifier: model/svm_model.pkl

Endpoint:
    POST /predict
    JSON body:
    {
        "model": "lr" | "svm",
        "posts": [
            { "title": "...", "body": "..." },
            ...
        ]
    }

Example Response:
    {
        "model": "lr",
        "predictions": [
            { "label": "positive", "score": 0.81 },
            { "label": "neutral",  "score": 0.65 },
            ...
        ]
    }
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import numpy as np  # for sigmoid on SVM decision_function

# Flask setup
app = Flask(__name__)
CORS(app)  # allow cross-origin requests (Node/frontend can call this)


# ----------------------------------------
# Loading models on startup
# ----------------------------------------
# I'm keeping this very explicit so its easy to understand

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

LR_VECTORIZER_PATH = os.path.join(MODEL_DIR, "vectorizer_lr.pkl")
LR_MODEL_PATH      = os.path.join(MODEL_DIR, "lr_model.pkl")
SVM_MODEL_PATH     = os.path.join(MODEL_DIR, "svm_model.pkl")

print("🔁 🔁 Loading sentiment models...")

vectorizer = None   # shared TF IDF vectoriser
MODELS = {}         # dict to hold all classifiers, e.g. {"lr": ..., "svm": ...}

try:
    # shared TF IDF vectoriser trained on my large combined dataset
    vectorizer = joblib.load(LR_VECTORIZER_PATH)
    print(f"✅ ✅ Loaded TF-IDF vectoriser from {LR_VECTORIZER_PATH}")

    # Logistic Regression model
    lr_model = joblib.load(LR_MODEL_PATH)
    MODELS["lr"] = lr_model
    print(f"✅ ✅ Loaded LR model from {LR_MODEL_PATH}")
    print("➡️ ➡️ LR classes:", lr_model.classes_)

    # SVM model
    svm_model = joblib.load(SVM_MODEL_PATH)
    MODELS["svm"] = svm_model
    print(f"✅ ✅ Loaded SVM model from {SVM_MODEL_PATH}")
    print("➡️ ➡️ SVM classes:", svm_model.classes_)

except Exception as e:
    # If something fails here, I want a loud error in the logs, its just easier to stop among all the mess.
    print("❌ ❌ ❌ Failed to load one or more models/vectoriser:", e)
    vectorizer = None
    MODELS = {}


# --------------------------------------------------
# Helper: generic prediction for any model in MODELS
# --------------------------------------------------

def predict_with_model(model_key, posts):
    """
    posts: list of dicts like:
        { "title": "...", "body": "..." }

    Returns: list of dicts:
        { "label": str, "score": float }
    """

    if vectorizer is None or not MODELS:
        raise RuntimeError("Models/vectoriser not loaded")

    if model_key not in MODELS:
        raise RuntimeError(f"Unknown model key: {model_key}")

    model = MODELS[model_key]

    # Building raw text for each post: title + body
    texts = []
    for p in posts:
        title = p.get("title", "") or ""
        body = p.get("body", "") or ""
        text = (str(title) + " " + str(body)).strip()
        # avoid completely empty strings (its rare edge case)
        texts.append(text if text else " ")

    # Text -> TF-IDF vectors
    X_vec = vectorizer.transform(texts)

    #update: using sigmoid formula to convert svm margins into 0-1 probability style 
    # Both LR and (optionally) SVM may expose predict_proba.
    # If not, but decision_function exists (typical SVM case),
    # I convert the raw margins into 0–1 style scores using a sigmoid.
    if hasattr(model, "predict_proba"):
        probas = model.predict_proba(X_vec)
        class_labels = list(model.classes_)
    elif hasattr(model, "decision_function"):
        # decision_function returns margins; higher = more confident
        margins = model.decision_function(X_vec)

        # Ensure 2D shape: (n_samples, n_classes)
        margins = np.atleast_2d(margins)

        class_labels = list(model.classes_)

        # Apply sigmoid to each margin to squash into [0,1]
        # prob = 1 / (1 + exp(-margin))
        probas = 1.0 / (1.0 + np.exp(-margins))
    else:
        raise RuntimeError(f"Model '{model_key}' does not support "
                           "predict_proba or decision_function")

    predictions = []
    for i in range(probas.shape[0]):
        row_probs = probas[i]
        max_idx = row_probs.argmax()
        label = class_labels[max_idx]
        score = float(row_probs[max_idx])

        predictions.append({
            "label": label,
            "score": score
        })

    return predictions


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------

@app.route("/", methods=["GET"])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "🔥 🔥 🔥 Flask ML service is running",
        "available_models": list(MODELS.keys())
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Main prediction endpoint

    Expects JSON:
        { "model": "lr" | "svm", "posts": [...] }

    If an unknown model is requested, I fall back to "lr"
    to keep the API forgiving.
    """
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON body"}), 400

    if not data:
        return jsonify({"error": "Missing JSON body"}), 400

    # default to LR if nothing is provided
    requested_model = (data.get("model") or "lr").lower()
    posts = data.get("posts")

    if not posts or not isinstance(posts, list):
        return jsonify({"error": "Field 'posts' must be a non-empty list"}), 400

    # Fallback to LR if someone passes a wrong model name
    if requested_model not in MODELS:
        requested_model = "lr"

    try:
        predictions = predict_with_model(requested_model, posts)
    except Exception as e:
        print("❌ ❌ ❌ Error during prediction:", e)
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500

    return jsonify({
        "model": requested_model,
        "predictions": predictions
    })


if __name__ == "__main__":
    # Running on port 5051 to match FLASK_API_URL
    port = int(os.environ.get("FLASK_PORT", 5051))
    app.run(host="0.0.0.0", port=port, debug=True)