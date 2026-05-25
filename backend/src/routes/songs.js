const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../db');
const upload = require('../middleware/uploadMiddleware');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middleware/authMiddleware');

// Helper to check if a request has a token and parse user ID
function getOptionalUserId(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (err) {
    return null;
  }
}

// Get all songs (with optional is_liked join if user logged in)
router.get('/', async (req, res) => {
  const userId = getOptionalUserId(req);

  try {
    let queryText = '';
    let params = [];

    if (userId) {
      queryText = `
        SELECT s.*, 
          (l.user_id IS NOT NULL) AS is_liked,
          (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS likes_count
        FROM songs s
        LEFT JOIN likes l ON l.song_id = s.id AND l.user_id = $1
        ORDER BY s.created_at DESC
      `;
      params = [userId];
    } else {
      queryText = `
        SELECT s.*, 
          FALSE AS is_liked,
          (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS likes_count
        FROM songs s
        ORDER BY s.created_at DESC
      `;
    }

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch songs error:', err);
    res.status(500).json({ error: 'Internal server error fetching songs.' });
  }
});

// Search songs by title, artist, or album
router.get('/search', async (req, res) => {
  const { q } = req.query;
  const userId = getOptionalUserId(req);

  if (!q) {
    return res.json([]);
  }

  const queryPattern = `%${q}%`;

  try {
    let queryText = '';
    let params = [];

    if (userId) {
      queryText = `
        SELECT s.*, 
          (l.user_id IS NOT NULL) AS is_liked,
          (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS likes_count
        FROM songs s
        LEFT JOIN likes l ON l.song_id = s.id AND l.user_id = $1
        WHERE s.title ILIKE $2 OR s.artist ILIKE $2 OR s.album ILIKE $2
        ORDER BY s.title ASC
      `;
      params = [userId, queryPattern];
    } else {
      queryText = `
        SELECT s.*, 
          FALSE AS is_liked,
          (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS likes_count
        FROM songs s
        WHERE s.title ILIKE $1 OR s.artist ILIKE $1 OR s.album ILIKE $1
        ORDER BY s.title ASC
      `;
      params = [queryPattern];
    }

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Search songs error:', err);
    res.status(500).json({ error: 'Internal server error searching songs.' });
  }
});

// Get trending songs (sorted by likes_count DESC, limit 10)
router.get('/trending', async (req, res) => {
  const userId = getOptionalUserId(req);

  try {
    let queryText = '';
    let params = [];

    if (userId) {
      queryText = `
        SELECT s.*, 
          (l.user_id IS NOT NULL) AS is_liked,
          (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS likes_count
        FROM songs s
        LEFT JOIN likes l ON l.song_id = s.id AND l.user_id = $1
        ORDER BY likes_count DESC, s.created_at DESC
        LIMIT 10
      `;
      params = [userId];
    } else {
      queryText = `
        SELECT s.*, 
          FALSE AS is_liked,
          (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS likes_count
        FROM songs s
        ORDER BY likes_count DESC, s.created_at DESC
        LIMIT 10
      `;
    }

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch trending error:', err);
    res.status(500).json({ error: 'Internal server error fetching trending songs.' });
  }
});

// Admin upload song
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  async (req, res) => {
    const { title, artist, album, duration } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Title and artist are required.' });
    }

    if (!req.files || !req.files.audio) {
      return res.status(400).json({ error: 'Audio file is required.' });
    }

    if (!req.files.cover) {
      return res.status(400).json({ error: 'Cover artwork file is required.' });
    }

    // Get files details
    const audioFile = req.files.audio[0];
    const coverFile = req.files.cover[0];

    // Compute relative server paths to serve statically
    // Inside container or local, paths should be '/uploads/audio/...' and '/uploads/covers/...'
    const audio_url = `/uploads/audio/${audioFile.filename}`;
    const cover_url = `/uploads/covers/${coverFile.filename}`;

    // Duration fallback (e.g. user-provided or 180 seconds)
    const songDuration = duration ? parseInt(duration, 10) : 180;

    try {
      const result = await db.query(
        `INSERT INTO songs (title, artist, album, duration, audio_url, cover_url, uploaded_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, title, artist, album, duration, audio_url, cover_url, created_at`,
        [title.trim(), artist.trim(), (album || 'Single').trim(), songDuration, audio_url, cover_url, req.user.id]
      );

      res.status(201).json({
        message: 'Song uploaded successfully',
        song: result.rows[0]
      });
    } catch (err) {
      console.error('Upload song error:', err);
      // Clean up uploaded files in case of db insertion failure
      try {
        fs.unlinkSync(audioFile.path);
        fs.unlinkSync(coverFile.path);
      } catch (unlinkErr) {
        console.error('Failed to clean up files on error:', unlinkErr);
      }
      res.status(500).json({ error: 'Database error saving song.' });
    }
  }
);

// Admin delete song
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Get file URLs to delete local assets
    const songResult = await db.query('SELECT audio_url, cover_url FROM songs WHERE id = $1', [id]);
    if (songResult.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    const song = songResult.rows[0];

    // Delete song from DB (cascade deletes likes and playlist junctions)
    await db.query('DELETE FROM songs WHERE id = $1', [id]);

    // Attempt to delete local files
    // The urls are '/uploads/audio/filename' so we map back to file system
    const audioPath = path.join(__dirname, '../..', song.audio_url);
    const coverPath = path.join(__dirname, '../..', song.cover_url);

    if (song.audio_url.startsWith('/uploads/')) {
      fs.unlink(audioPath, (err) => {
        if (err) console.error(`Error deleting audio file: ${audioPath}`, err);
      });
    }

    if (song.cover_url.startsWith('/uploads/')) {
      fs.unlink(coverPath, (err) => {
        if (err) console.error(`Error deleting cover file: ${coverPath}`, err);
      });
    }

    res.json({ message: 'Song deleted successfully.' });
  } catch (err) {
    console.error('Delete song error:', err);
    res.status(500).json({ error: 'Internal server error deleting song.' });
  }
});

module.exports = router;
