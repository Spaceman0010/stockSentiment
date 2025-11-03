# utils.py
import re
import os
import pandas as pd

# Cleans text: removes special characters, lowercases, etc.
def clean_text(text):
    text = text.lower()
    text = re.sub(r'<[^>]+>', '', text)  # Remove HTML tags
    text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
    text = re.sub(r'\s+', ' ', text).strip()  # Remove extra whitespace
    return text

# Loads and combines Sentiment140 CSV + IMDB text files
def load_datasets():
    sentiment140_path = 'data/training.1600000.processed.noemoticon.csv'
    imdb_path = 'data/aclImdb'

    texts = []
    labels = []

    # Load Sentiment140 (Twitter dataset)
    df = pd.read_csv(sentiment140_path, encoding='latin-1', header=None)
    df.columns = ['target', 'id', 'date', 'flag', 'user', 'text']
    for _, row in df.iterrows():
        text = clean_text(row['text'])
        label = 1 if row['target'] == 4 else 0  # 4 = positive, 0 = negative
        texts.append(text)
        labels.append(label)

    # Load IMDB dataset (movie reviews)
    for split in ['train', 'test']:
        for sentiment in ['pos', 'neg']:
            folder = os.path.join(imdb_path, split, sentiment)
            for filename in os.listdir(folder):
                with open(os.path.join(folder, filename), 'r', encoding='utf-8') as f:
                    text = clean_text(f.read())
                    label = 1 if sentiment == 'pos' else 0
                    texts.append(text)
                    labels.append(label)

    return texts, labels