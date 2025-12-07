import pandas as pd
import numpy as np
import nltk
import re
import joblib
import os

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import PassiveAggressiveClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, classification_report

# Download NLTK datasets
nltk.download("stopwords")
nltk.download("wordnet")

STOPWORDS = set(stopwords.words("english"))
LEMMA = WordNetLemmatizer()

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    words = [LEMMA.lemmatize(w) for w in text.split() if w not in STOPWORDS]
    return " ".join(words)

print("Loading dataset...")
df = pd.read_csv("data/train.csv")
df["clean_text"] = df["text"].apply(clean_text)

X = df["clean_text"]
y = df["label"]

# Encode labels
le = LabelEncoder()
y_enc = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)

# TF-IDF vectorizer
tfidf = TfidfVectorizer(max_features=50000, ngram_range=(1, 2))
X_train_vec = tfidf.fit_transform(X_train)
X_test_vec = tfidf.transform(X_test)

# Model
clf = PassiveAggressiveClassifier(max_iter=1000)
clf.fit(X_train_vec, y_train)

# Predictions
y_pred = clf.predict(X_test_vec)

# Metrics
print("Accuracy:", accuracy_score(y_test, y_pred))
print("F1 Score:", f1_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))

os.makedirs("models", exist_ok=True)

# Save artifacts
joblib.dump(tfidf, "models/tfidf.joblib")
joblib.dump(clf, "models/model.joblib")
joblib.dump(le, "models/label_encoder.joblib")

print("\nModel + Vectorizer saved successfully in /models folder!")
