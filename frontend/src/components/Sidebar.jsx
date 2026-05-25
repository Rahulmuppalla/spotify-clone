import React, { useState, useEffect } from 'react';
import { Home, Search, Library, PlusSquare, Heart, Music, LogOut, Disc, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';

const Sidebar = ({ activeTab, setActiveTab, setSelectedPlaylistId }) => {
  const { user, logout, token, API_BASE } = useAuth();
  const { playSong } = useAudio();
  const [playlists, setPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  // Fetch user playlists
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
      console.error('Error fetching playlists:', err);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [token]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDesc
        })
      });

      if (res.ok) {
        setNewPlaylistName('');
        setNewPlaylistDesc('');
        setShowCreateModal(false);
        fetchPlaylists();
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
    }
  };

  const handlePlaylistClick = (playlistId) => {
    setSelectedPlaylistId(playlistId);
    setActiveTab('playlist');
  };

  return (
    <aside className="w-64 bg-black flex flex-col gap-2 p-2 h-full text-zinc-400 font-medium">
      {/* Brand logo */}
      <div className="bg-spotify-lightdark rounded-lg p-5 flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
        <Disc className="w-8 h-8 text-spotify-green animate-spin-slow" />
        <span className="text-white text-xl font-bold tracking-tight">Spotify<span className="text-spotify-green">.</span></span>
      </div>

      {/* Main navigation */}
      <div className="bg-spotify-lightdark rounded-lg p-4 flex flex-col gap-4">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center gap-4 transition duration-200 hover:text-white text-left ${activeTab === 'home' ? 'text-white' : ''}`}
        >
          <Home className="w-6 h-6" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-4 transition duration-200 hover:text-white text-left ${activeTab === 'search' ? 'text-white' : ''}`}
        >
          <Search className="w-6 h-6" />
          <span>Search</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-4 transition duration-200 hover:text-white text-left ${activeTab === 'library' ? 'text-white' : ''}`}
        >
          <Library className="w-6 h-6" />
          <span>Your Library</span>
        </button>

        {user?.is_admin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-4 transition duration-200 hover:text-white text-left ${activeTab === 'admin' ? 'text-spotify-green' : ''}`}
          >
            <LayoutDashboard className="w-6 h-6 text-spotify-green" />
            <span className="text-spotify-green font-semibold">Admin Panel</span>
          </button>
        )}
      </div>

      {/* Playlists and actions */}
      <div className="bg-spotify-lightdark rounded-lg p-4 flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Playlists</span>
          {token && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="hover:text-white transition duration-200"
              title="Create Playlist"
            >
              <PlusSquare className="w-5 h-5" />
            </button>
          )}
        </div>

        {token ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800 hover:text-white transition group ${activeTab === 'favorites' ? 'bg-zinc-800 text-white' : ''}`}
            >
              <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-700 to-purple-500 flex items-center justify-center text-white shadow-md">
                <Heart className="w-4 h-4 fill-current text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold truncate text-white">Liked Songs</p>
                <p className="text-xs text-zinc-400 group-hover:text-zinc-300">Your favorites</p>
              </div>
            </button>
          </div>
        ) : null}

        {/* Scrollable Playlist List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 border-t border-zinc-800/40 pt-2">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => handlePlaylistClick(playlist.id)}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/50 hover:text-white transition text-left group"
            >
              <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                {playlist.cover_url ? (
                  <img src={playlist.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-4 h-4 text-zinc-400" />
                )}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold truncate text-white group-hover:text-spotify-green">{playlist.name}</p>
                <p className="text-xs text-zinc-500 truncate">{playlist.song_count} songs</p>
              </div>
            </button>
          ))}
          {token && playlists.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-4">No playlists yet. Create one above!</p>
          )}
          {!token && (
            <p className="text-xs text-zinc-600 text-center py-4">Log in to create and see playlists.</p>
          )}
        </div>

        {/* User profile / Logout */}
        {user && (
          <div className="border-t border-zinc-850 pt-3 flex items-center justify-between shrink-0">
            <div className="truncate pr-2">
              <p className="text-sm text-white font-semibold truncate">{user.username}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-full hover:bg-zinc-800 hover:text-red-500 transition text-zinc-400 shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Create Playlist Modal Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form
            onSubmit={handleCreatePlaylist}
            className="bg-spotify-lightdark rounded-lg border border-zinc-800 p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl"
          >
            <h2 className="text-lg font-bold text-white">Create Playlist</h2>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-bold uppercase">Playlist Name</label>
              <input
                type="text"
                placeholder="My Awesome Playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-zinc-850 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-spotify-green text-sm"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-bold uppercase">Description (Optional)</label>
              <textarea
                placeholder="Give your playlist a description..."
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                className="w-full bg-zinc-850 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-spotify-green text-sm resize-none h-20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded text-zinc-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-spotify-green hover:bg-emerald-500 text-black font-semibold rounded text-sm transition"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
