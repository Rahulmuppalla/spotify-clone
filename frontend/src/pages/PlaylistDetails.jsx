import React, { useState, useEffect } from 'react';
import { Play, Pause, Heart, Clock, Trash2, Music, AlertCircle } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { ListSkeleton } from '../components/Skeleton';

const PlaylistDetails = ({ playlistId, setActiveTab, activeTab }) => {
  const { user, token, API_BASE } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay } = useAudio();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlaylistDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load playlist details.');
      }
      setPlaylist(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistDetails();
    }
  }, [playlistId, token]);

  const handlePlayPlaylist = () => {
    if (!playlist || playlist.songs.length === 0) return;
    
    // Play first song and load entire playlist array as queue
    const firstSong = playlist.songs[0];
    if (currentSong?.id === firstSong.id) {
      togglePlay();
    } else {
      playSong(firstSong, playlist.songs);
    }
  };

  const handlePlayRow = (song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song, playlist.songs);
    }
  };

  const handleLikeSong = async (song, idx, e) => {
    e.stopPropagation();
    const isLiked = song.is_liked;
    const url = `${API_BASE}/me/favorites/${song.id}`;
    const method = isLiked ? 'DELETE' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const updatedSongs = [...playlist.songs];
        updatedSongs[idx] = { ...song, is_liked: !isLiked };
        setPlaylist({ ...playlist, songs: updatedSongs });
      }
    } catch (err) {
      console.error('Error liking song in playlist:', err);
    }
  };

  const handleRemoveSong = async (songId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Refresh playlist list
        fetchPlaylistDetails();
      }
    } catch (err) {
      console.error('Error removing song from playlist:', err);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!window.confirm('Are you sure you want to delete this playlist? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Go back to Library and reload playlists sidebar
        setActiveTab('library');
        // Simple reload hack to sync sidebar, or standard state callbacks
        window.location.reload();
      }
    } catch (err) {
      console.error('Error deleting playlist:', err);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex-1 bg-spotify-dark p-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row items-end gap-6 mb-6 animate-pulse mt-4">
          <div className="w-48 h-48 bg-zinc-800 rounded shadow-md shrink-0"></div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-4 bg-zinc-800 rounded w-16"></div>
            <div className="h-10 bg-zinc-800 rounded w-2/3"></div>
            <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
          </div>
        </div>
        <ListSkeleton count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-spotify-dark flex flex-col items-center justify-center p-6 text-zinc-500">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-white font-semibold mb-2">Something went wrong</p>
        <p className="text-sm max-w-xs text-center mb-4">{error}</p>
        <button onClick={() => setActiveTab('library')} className="text-xs text-zinc-400 hover:text-white font-bold underline">
          Back to Library
        </button>
      </div>
    );
  }

  if (!playlist) return null;

  const isOwner = user?.id === playlist.user_id;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-teal-900/60 to-spotify-dark p-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-end gap-6 mb-6 mt-4">
        {/* Cover */}
        <div className="w-48 h-48 bg-zinc-800 rounded shadow-2xl overflow-hidden shrink-0 flex items-center justify-center border border-zinc-700/30">
          {playlist.cover_url ? (
            <img src={playlist.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Music className="w-16 h-16 text-zinc-650" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider">PLAYLIST</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-1">
            {playlist.name}
          </h1>
          <p className="text-sm text-zinc-300 font-medium">{playlist.description || 'No description provided.'}</p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold mt-2">
            <span className="text-white hover:underline cursor-pointer">{playlist.creator_name}</span>
            <span className="text-zinc-500">•</span>
            <span>{playlist.songs.length} songs</span>
          </div>
        </div>
      </div>

      {/* Main Bar Controls */}
      <div className="flex items-center justify-between py-6">
        <div className="flex items-center gap-6">
          {playlist.songs.length > 0 && (
            <button
              onClick={handlePlayPlaylist}
              className="w-14 h-14 rounded-full bg-spotify-green text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shrink-0"
              title="Play Playlist"
            >
              {playlist.songs.some(s => s.id === currentSong?.id) && isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>
          )}

          {isOwner && (
            <button
              onClick={handleDeletePlaylist}
              className="text-zinc-400 hover:text-red-500 transition duration-200"
              title="Delete Playlist"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Tracks Table */}
      {playlist.songs.length > 0 ? (
        <div className="bg-zinc-950/20 rounded-lg p-4">
          {/* Table Header */}
          <div className="flex items-center text-xs text-zinc-500 font-bold uppercase tracking-wider px-2 py-2 border-b border-zinc-800/60 mb-2">
            <span className="w-8 text-center shrink-0">#</span>
            <span className="flex-1">Title</span>
            <span className="w-1/3 hidden md:block">Added Date</span>
            <span className="w-16 text-center shrink-0">
              <Clock className="w-4 h-4 mx-auto" />
            </span>
            <span className="w-10 shrink-0"></span>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-0.5">
            {playlist.songs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              const coverUrl = song.cover_url.startsWith('/uploads/')
                ? `http://localhost:5000${song.cover_url}`
                : song.cover_url;

              return (
                <div
                  key={song.id}
                  onClick={() => handlePlayRow(song)}
                  className={`flex items-center px-2 py-2 rounded-md hover:bg-zinc-850/60 transition duration-200 group cursor-pointer ${
                    isCurrent ? 'bg-zinc-800/40' : ''
                  }`}
                >
                  {/* Number / Hover play */}
                  <div className="w-8 text-center shrink-0 flex items-center justify-center">
                    <span className={`text-sm font-semibold group-hover:hidden ${
                      isCurrent ? 'text-spotify-green' : 'text-zinc-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <button className="hidden group-hover:block text-white">
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current text-spotify-green" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>
                  </div>

                  {/* Art, Title, Artist */}
                  <div className="flex-1 min-w-0 flex items-center gap-3 pr-4">
                    <img src={coverUrl} alt="" className="w-10 h-10 object-cover rounded shadow shrink-0" />
                    <div className="truncate">
                      <p className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-spotify-green' : 'text-white'
                      }`}>{song.title}</p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                    </div>
                  </div>

                  {/* Added Date */}
                  <div className="w-1/3 hidden md:block text-sm text-zinc-400 truncate">
                    {formatDate(song.added_at)}
                  </div>

                  {/* Duration */}
                  <div className="w-16 text-center text-xs text-zinc-400 shrink-0 font-medium">
                    {formatTime(song.duration)}
                  </div>

                  {/* Remove Button (Trash) */}
                  <div className="w-10 shrink-0 flex items-center justify-center">
                    {isOwner ? (
                      <button
                        onClick={(e) => handleRemoveSong(song.id, e)}
                        className="text-zinc-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remove from playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleLikeSong(song, idx, e)}
                        className="text-zinc-400 hover:text-white transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Heart className={`w-4 h-4 ${song.is_liked ? 'text-spotify-green fill-current' : ''}`} />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Music className="w-12 h-12 text-zinc-700 mb-2 animate-pulse" />
          <p className="font-semibold text-sm mb-1 text-zinc-400">This playlist is empty</p>
          <p className="text-xs text-zinc-650">Search for tracks and add them here!</p>
        </div>
      )}

    </div>
  );
};

export default PlaylistDetails;
