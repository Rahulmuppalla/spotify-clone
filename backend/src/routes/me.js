const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get user's favorited/liked songs
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, 
         TRUE AS is_liked,
         (SELECT COUNT(*) FROM likes WHERE song_id = s.id) AS likes_count
       FROM songs s
       JOIN likes l ON l.song_id = s.id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch favorite songs error:', err);
    res.status(500).json({ error: 'Internal server error fetching favorite songs.' });
  }
});

// Like a song
router.post('/favorites/:songId', authenticateToken, async (req, res) => {
  const { songId } = req.params;

  try {
    // Check if song exists
    const songExists = await db.query('SELECT 1 FROM songs WHERE id = $1', [songId]);
    if (songExists.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    // Check if already liked
    const alreadyLiked = await db.query(
      'SELECT 1 FROM likes WHERE user_id = $1 AND song_id = $2',
      [req.user.id, songId]
    );

    if (alreadyLiked.rows.length > 0) {
      return res.json({ message: 'Song already liked.' });
    }

    await db.query('INSERT INTO likes (user_id, song_id) VALUES ($1, $2)', [req.user.id, songId]);
    res.status(201).json({ message: 'Song added to favorites.' });
  } catch (err) {
    console.error('Like song error:', err);
    res.status(500).json({ error: 'Internal server error liking song.' });
  }
});

// Unlike a song
router.delete('/favorites/:songId', authenticateToken, async (req, res) => {
  const { songId } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM likes WHERE user_id = $1 AND song_id = $2',
      [req.user.id, songId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Favorite record not found.' });
    }

    res.json({ message: 'Song removed from favorites.' });
  } catch (err) {
    console.error('Unlike song error:', err);
    res.status(500).json({ error: 'Internal server error unliking song.' });
  }
});

// Get user's recently played tracks (unique by song, ordered by most recently played)
router.get('/recently-played', authenticateToken, async (req, res) => {
  try {
    // We want the most recent play, distinct by song_id
    const result = await db.query(
      `SELECT DISTINCT ON (rp.song_id) 
         s.*,
         (l.user_id IS NOT NULL) AS is_liked,
         rp.played_at
       FROM recently_played rp
       JOIN songs s ON s.id = rp.song_id
       LEFT JOIN likes l ON l.song_id = s.id AND l.user_id = $1
       WHERE rp.user_id = $1
       ORDER BY rp.song_id, rp.played_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    // Since DISTINCT ON requires the primary ORDER BY to match the distinct column, 
    // we need to sort the final list by played_at DESC in JS
    const sortedTracks = result.rows.sort((a, b) => new Date(b.played_at) - new Date(a.played_at));

    res.json(sortedTracks);
  } catch (err) {
    console.error('Fetch recently played error:', err);
    res.status(500).json({ error: 'Internal server error fetching recently played.' });
  }
});

// Record a song play
router.post('/recently-played/:songId', authenticateToken, async (req, res) => {
  const { songId } = req.params;

  try {
    // Check if song exists
    const songExists = await db.query('SELECT 1 FROM songs WHERE id = $1', [songId]);
    if (songExists.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    await db.query('INSERT INTO recently_played (user_id, song_id) VALUES ($1, $2)', [req.user.id, songId]);

    // Optional: Clean up history if it gets too long for this user (e.g. keep only last 50 plays)
    // For simplicity, we just insert.
    res.status(201).json({ message: 'Playback recorded.' });
  } catch (err) {
    console.error('Record playback error:', err);
    res.status(500).json({ error: 'Internal server error recording playback.' });
  }
});

module.exports = router;
