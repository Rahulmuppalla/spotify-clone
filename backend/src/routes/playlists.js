const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get current user's playlists
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, COUNT(ps.song_id) AS song_count 
       FROM playlists p
       LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch playlists error:', err);
    res.status(500).json({ error: 'Internal server error fetching playlists.' });
  }
});

// Create a new playlist
router.post('/', authenticateToken, async (req, res) => {
  const { name, description, cover_url } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Playlist name is required.' });
  }

  // Fallback random/cool unsplash cover if none provided
  const fallbackCover = cover_url || 'https://images.unsplash.com/photo-1487180142328-054b783fc471?w=500&q=80';

  try {
    const result = await db.query(
      `INSERT INTO playlists (name, description, cover_url, user_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name.trim(), description ? description.trim() : '', fallbackCover, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create playlist error:', err);
    res.status(500).json({ error: 'Internal server error creating playlist.' });
  }
});

// Get playlist details along with its songs
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get playlist metadata
    const playlistResult = await db.query(
      `SELECT p.*, u.username AS creator_name
       FROM playlists p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [id]
    );

    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }

    const playlist = playlistResult.rows[0];

    // Verify ownership (or we can let any logged-in user view it since it's a social app; let's allow anyone to view but only owner to modify)
    
    // 2. Get playlist songs (with is_liked flag for the current user)
    const songsResult = await db.query(
      `SELECT s.*, 
         (l.user_id IS NOT NULL) AS is_liked,
         ps.added_at
       FROM songs s
       JOIN playlist_songs ps ON ps.song_id = s.id
       LEFT JOIN likes l ON l.song_id = s.id AND l.user_id = $1
       WHERE ps.playlist_id = $2
       ORDER BY ps.added_at ASC`,
      [req.user.id, id]
    );

    playlist.songs = songsResult.rows;
    res.json(playlist);
  } catch (err) {
    console.error('Fetch playlist details error:', err);
    res.status(500).json({ error: 'Internal server error fetching playlist details.' });
  }
});

// Add a song to playlist
router.post('/:id/songs', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { songId } = req.body;

  if (!songId) {
    return res.status(400).json({ error: 'Song ID is required.' });
  }

  try {
    // Check if playlist exists and belongs to current user
    const playlistCheck = await db.query('SELECT * FROM playlists WHERE id = $1', [id]);
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }

    if (playlistCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the playlist creator can add songs.' });
    }

    // Check if song already exists in playlist to avoid unique constraint violations
    const songExists = await db.query(
      'SELECT 1 FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [id, songId]
    );
    if (songExists.rows.length > 0) {
      return res.status(400).json({ error: 'Song is already in this playlist.' });
    }

    // Insert song into playlist
    await db.query(
      'INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2)',
      [id, songId]
    );

    res.json({ message: 'Song added to playlist.' });
  } catch (err) {
    console.error('Add song to playlist error:', err);
    res.status(500).json({ error: 'Internal server error adding song to playlist.' });
  }
});

// Remove a song from playlist
router.delete('/:id/songs/:songId', authenticateToken, async (req, res) => {
  const { id, songId } = req.params;

  try {
    // Check playlist ownership
    const playlistCheck = await db.query('SELECT user_id FROM playlists WHERE id = $1', [id]);
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }

    if (playlistCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the playlist creator can remove songs.' });
    }

    const deleteResult = await db.query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [id, songId]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Song is not in this playlist.' });
    }

    res.json({ message: 'Song removed from playlist.' });
  } catch (err) {
    console.error('Remove song from playlist error:', err);
    res.status(500).json({ error: 'Internal server error removing song from playlist.' });
  }
});

// Delete a playlist
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check playlist ownership
    const playlistCheck = await db.query('SELECT user_id FROM playlists WHERE id = $1', [id]);
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }

    if (playlistCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the playlist creator can delete this playlist.' });
    }

    await db.query('DELETE FROM playlists WHERE id = $1', [id]);
    res.json({ message: 'Playlist deleted.' });
  } catch (err) {
    console.error('Delete playlist error:', err);
    res.status(500).json({ error: 'Internal server error deleting playlist.' });
  }
});

module.exports = router;
