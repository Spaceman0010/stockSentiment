const mongoose = require('mongoose');

const RedditPostSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    uppercase: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
  },
  subreddit: {
    type: String,
    default: 'unknown'
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
  },
  sentimentScore: {
    type: Number,
  },
  modelUsed: {
    type: String, // e.g. 'lr', 'svm', 'distilbert'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('RedditPost', RedditPostSchema);