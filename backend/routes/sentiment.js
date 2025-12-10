const express = require('express');
const router = express.Router();
const axios = require('axios');
const RedditPost = require('../models/RedditPost');
const Sentiment = require('../models/Sentiment');

// ENV variable for Flask API
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:5051';

// POST /api/sentiment/analyse
// Send Reddit posts to Flask for prediction, then save results
router.post('/analyse', async (req, res) => {
  try {
    const { posts, ticker, model } = req.body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: 'No posts provided' });
    }

    // Send data to the Flask model
    const response = await axios.post(`${FLASK_API_URL}/predict`, {
      posts,
      model,
    });

    const predictions = response.data.predictions;

    // Save each post with prediction to MongoDB
    const savedDocs = [];
    for (let i = 0; i < posts.length; i++) {
      const doc = new RedditPost({
        ticker,
        title: posts[i].title || '',
        body: posts[i].body || '',
        subreddit: posts[i].subreddit || '',
        sentiment: predictions[i].label,
        sentimentScore: predictions[i].score,
        modelUsed: model,
      });
      await doc.save();
      savedDocs.push(doc);
    }

    res.status(201).json({
      message: 'Sentiment analysis completed',
      count: savedDocs.length,
      data: savedDocs,
    });
  } catch (error) {
    console.error('Error analysing sentiment:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/sentiment/daily/:ticker
// Retrieve aggregated sentiment data
router.get('/daily/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const data = await Sentiment.find({ ticker }).sort({ date: 1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sentiment data' });
  }
});

module.exports = router;