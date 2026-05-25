const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const songRoutes = require('./routes/songs');
const playlistRoutes = require('./routes/playlists');
const meRoutes = require('./routes/me');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend connection (either docker container or localhost)
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded audio and cover images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check API
app.get('/api/health', async (req, res) => {
  try {
    const dbCheck = await db.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: dbCheck.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message
    });
  }
});

// Register REST API Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/me', meRoutes);

// Generic Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.'
  });
});

// Test DB Connection and start listening
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const res = await db.query('SELECT NOW()');
    console.log('Database connection verification success:', res.rows[0].now);
  } catch (err) {
    console.error('WARNING: Database connection failed on startup!', err.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server and DB pool...');
  server.close(() => {
    db.pool.end(() => {
      console.log('HTTP server and DB pool closed.');
      process.exit(0);
    });
  });
});
