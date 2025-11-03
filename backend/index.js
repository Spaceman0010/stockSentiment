const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const sentimentRoutes = require('./routes/sentiment'); // new sentiment route

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Debugging middleware 
app.use((req, res, next) => {
  console.log(`🚀 Incoming request: ${req.method} ${req.url}`);
  next();
});

// Use new sentiment route
app.use('/api/sentiment', sentimentRoutes);

// Base route for quick check
app.get('/', (req, res) => {
  res.send('🔥 Stock Sentiment Backend is LIVE!');
});

// Async function to connect to MongoDB and start server
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');

    const PORT = process.env.PORT || 5050;
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
  }
}

startServer();