const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const sentimentRoutes = require('./routes/sentiment'); // new sentiment route

// update: im adding these two new route files for frontend dashboard + backtesting pages
const dashboardRoutes = require('./routes/dashboard');
console.log("✅ dashboard route file loaded"); //test health check
console.log("✅ dashboard.js path:", require.resolve("./routes/dashboard")); //test

const backtestRoutes = require('./routes/backtest');
console.log("✅ backtest route file loaded"); //test health check
console.log("✅ backtest.js path:", require.resolve("./routes/backtest")); //test

dotenv.config();

const app = express();
// ✅ I print this so I 100% know which file Node is running
console.log("✅ RUNNING FILE:", __filename);
app.use(cors());
app.use(express.json());
// ✅ If this doesn't work, it means my code changes are not being used
app.get('/api/_ping', (req, res) => {
  res.json({ ok: true });
});

// Debugging middleware 
app.use((req, res, next) => {
  console.log(`🚀 Incoming request: ${req.method} ${req.url}`);
  next();
});

// Use new sentiment route
app.use('/api/sentiment', sentimentRoutes);

// update: dashboard summary endpoint for my "quantifiable metrics" page
app.use('/api/dashboard', dashboardRoutes);
console.log("✅ /api/dashboard mounted"); //test health check
// if this works in browser, it proves my server + routing is fine
app.get('/api/_ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// update: backtest rows/run endpoints for my Backtesting tab (table pulls real data later)
app.use('/api/backtest', backtestRoutes);
console.log("✅ /api/backtest mounted"); //test health check

//printRoutes(app);

// Base route for quick check
app.get('/', (req, res) => {
  res.send('🔥 Stock Sentiment Backend is now LIVE! TESTING TESTING');
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

// ✅ I print all routes so I can see what Express actually registered
{/*
  function printRoutes(app) {
  console.log("🧾 REGISTERED ROUTES:");
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).join(",").toUpperCase();
      console.log(`   ${methods} ${m.route.path}`);
    }
    if (m.name === "router" && m.handle.stack) {
      m.handle.stack.forEach((h) => {
        if (h.route && h.route.path) {
          const methods = Object.keys(h.route.methods).join(",").toUpperCase();
          console.log(`   ${methods} ${h.route.path}`);
        }
      });
    }
  });
}
  
  */}


startServer();