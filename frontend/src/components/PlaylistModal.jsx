import React, { useState, useEffect } from 'react';
import { X, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PlaylistModal = ({ songId, onClose }) => {
  const { token, API_BASE } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/playlists`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPlaylists(data);
        }
      } catch (err) {
        console.error('Error loading playlists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, [token]);

  const handleAddSong = async (playlistId) => {
    try {
      const res = await fetch(`${API_BASE}/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ songId })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Song added to playlist!' });
        setTimeout(() => onClose(), 1000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add song.' });
      }
    } catch (err) {
      console.error('Error adding song to playlist:', err);
      setMessage({ type: 'error', text: 'Network error occurred.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-spotify-lightdark border border-zinc-800 rounded-lg p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-white pr-6">Add to Playlist</h2>

        {message && (
          <div className={`p-2 rounded text-xs text-center font-semibold ${
            message.type === 'success' ? 'bg-spotify-green/20 text-spotify-green' : 'bg-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-zinc-500 text-center py-4">Loading playlists...</p>
        ) : (
          <div className="max-h-60 overflow-y-auto flex flex-col gap-1 pr-1">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleAddSong(playlist.id)}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800 text-left transition group"
              >
                <div className="w-9 h-9 bg-zinc-800 rounded flex items-center justify-center overflow-hidden shrink-0">
                  {playlist.cover_url ? (
                    <img src={playlist.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold truncate text-white group-hover:text-spotify-green">
                    {playlist.name}
                  </p>
                  <p className="text-xs text-zinc-500">{playlist.song_count} songs</p>
                </div>
              </button>
            ))}
            {playlists.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-4">
                No playlists. Create one in the sidebar first!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistModal;
