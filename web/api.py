from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import numpy as np

# Download NLTK data
nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)
nltk.download("omw-1.4", quiet=True)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Initialize NLTK components
STOPWORDS = set(stopwords.words("english"))
LEMMA = WordNetLemmatizer()

# Load models
try:
    tfidf = joblib.load("models/tfidf.joblib")
    clf = joblib.load("models/model.joblib")
    le = joblib.load("models/label_encoder.joblib")
    print("✓ Models loaded successfully")
except Exception as e:
    print(f"✗ Error loading models: {e}")
    tfidf = None
    clf = None
    le = None

def clean_text(text):
    """Clean and preprocess text for analysis"""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    words = [LEMMA.lemmatize(w) for w in text.split() if w not in STOPWORDS]
    return " ".join(words)

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze news text for fake news detection"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text or len(text.strip()) == 0:
            return jsonify({'error': 'No text provided'}), 400
        
        # Check if models are loaded
        if not all([tfidf, clf, le]):
            return jsonify({'error': 'Models not loaded'}), 500
        
        # Clean and vectorize text
        cleaned = clean_text(text)
        vec = tfidf.transform([cleaned])
        
        # Make prediction
        pred = clf.predict(vec)[0]
        label = le.inverse_transform([pred])[0]
        
        # Calculate confidence
        score = clf.decision_function(vec)[0]
        confidence = float(1 / (1 + np.exp(-abs(score))))
        
        return jsonify({
            'label': label,
            'confidence': confidence,
            'cleaned_text': cleaned[:200]  # Return first 200 chars of cleaned text
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': all([tfidf, clf, le])
    })

@app.route('/', methods=['GET'])
def home():
    """Root endpoint"""
    return jsonify({
        'message': 'TruthLens API',
        'version': '1.0',
        'endpoints': {
            '/analyze': 'POST - Analyze news text',
            '/health': 'GET - Health check'
        }
    })

if __name__ == '__main__':
    import os
    
    print("\n🔍 TruthLens API Server")
    print("=" * 50)
    
    # Get port from environment variable (for deployment) or use 5000
    port = int(os.environ.get('PORT', 5000))
    
    print(f"Server running on: http://0.0.0.0:{port}")
    print("Endpoints:")
    print("  - POST /analyze - Analyze news text")
    print("  - GET  /health  - Health check")
    print("=" * 50 + "\n")
    
    # Use 0.0.0.0 to allow external connections (needed for deployment)
    app.run(debug=False, port=port, host='0.0.0.0')
