# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS

import joblib
import traceback
from utils import clean_text

app = Flask(__name__)
CORS(app)

# Load model and vectorizer
model = joblib.load('model/sentiment_model.pkl')
vectorizer = joblib.load('model/vectorizer.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        comment = data.get('text', '')
        cleaned = clean_text(comment)
        vector = vectorizer.transform([cleaned])
        prediction = model.predict(vector)[0]
        confidence = model.predict_proba(vector).max()

        # Convert prediction to score (1 = pos → 0.9, 0 = neg → 0.2)
        sentiment_score = 0.9 if prediction == 1 else 0.2

        return jsonify({
            "sentiment": sentiment_score,
            "confidence": float(confidence)
        })

    except Exception as e:
        print("❌ Error in prediction:", traceback.format_exc())
        return jsonify({"error": "Prediction failed"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5051, debug=True)