const mongoose = require('mongoose');

const SentimentSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    uppercase: true,
  },
  date: {
    type: Date,
    required: true,
  },
  averageScore: {
    type: Number,
    required: true,
  },
  positiveCount: {
    type: Number,
    default: 0,
  },
  negativeCount: {
    type: Number,
    default: 0,
  },
  neutralCount: {
    type: Number,
    default: 0,
  },
  totalPosts: {
    type: Number,
    default: 0,
  },
  modelUsed: {
    type: String, // model type used for aggregation
  },
});

module.exports = mongoose.model('Sentiment', SentimentSchema);