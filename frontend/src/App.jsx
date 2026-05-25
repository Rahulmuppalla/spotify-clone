import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AudioProvider, useAudio } from './context/AudioContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Player from './components/Player';
import Queue from './components/Queue';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import PlaylistDetails from './pages/PlaylistDetails';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import { Heart, Clock, Play, Pause, Music } from 'lucide-react';
import { ListSkeleton } from './components/Skeleton';

// Favorites/Liked Songs Page
const FavoritesPage = ({ setActiveTab }) => {
  const { token, API_BASE } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay } = useAudio();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/me/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [token]);

  const handlePlayRow = (song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song, songs);
    }
  };

  const handleUnlike = async (songId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/me/favorites/${songId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSongs(songs.filter(s => s.id !== songId));
      }
    } catch (err) {
      console.error('Error unliking:', err);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-indigo-900/60 to-spotify-dark p-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-end gap-6 mb-6 mt-4">
        <div className="w-48 h-48 bg-gradient-to-br from-indigo-650 via-purple-600 to-pink-500 rounded shadow-2xl overflow-hidden shrink-0 flex items-center justify-center border border-zinc-700/30">
          <Heart className="w-16 h-16 fill-current text-white" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider">PLAYLIST</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-1">
            Liked Songs
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold mt-2">
            <span className="text-white hover:underline cursor-pointer">Your Library</span>
            <span className="text-zinc-500">•</span>
            <span>{songs.length} songs</span>
          </div>
        </div>
      </div>

      {/* Main bar controls */}
      {songs.length > 0 && (
        <div className="flex items-center gap-6 py-6">
          <button
            onClick={() => playSong(songs[0], songs)}
            className="w-14 h-14 rounded-full bg-spotify-green text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shrink-0"
            title="Play Liked Songs"
          >
            {songs.some(s => s.id === currentSong?.id) && isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Songs Table */}
      {loading ? (
        <ListSkeleton count={5} />
      ) : songs.length > 0 ? (
        <div className="bg-zinc-950/20 rounded-lg p-4">
          <div className="flex items-center text-xs text-zinc-500 font-bold uppercase tracking-wider px-2 py-2 border-b border-zinc-800/60 mb-2">
            <span className="w-8 text-center shrink-0">#</span>
            <span className="flex-1">Title</span>
            <span className="w-1/3 hidden md:block">Album</span>
            <span className="w-16 text-center shrink-0">
              <Clock className="w-4 h-4 mx-auto" />
            </span>
            <span className="w-10 shrink-0"></span>
          </div>

          <div className="flex flex-col gap-0.5">
            {songs.map((song, idx) => {
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

                  <div className="flex-1 min-w-0 flex items-center gap-3 pr-4">
                    <img src={coverUrl} alt="" className="w-10 h-10 object-cover rounded shadow shrink-0" />
                    <div className="truncate">
                      <p className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-spotify-green' : 'text-white'
                      }`}>{song.title}</p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                    </div>
                  </div>

                  <div className="w-1/3 hidden md:block text-sm text-zinc-400 truncate">
                    {song.album}
                  </div>

                  <div className="w-16 text-center text-xs text-zinc-400 shrink-0 font-medium">
                    {formatTime(song.duration)}
                  </div>

                  <div className="w-10 shrink-0 flex items-center justify-center">
                    <button
                      onClick={(e) => handleUnlike(song.id, e)}
                      className="text-spotify-green hover:text-white transition"
                      title="Unlike track"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Music className="w-12 h-12 text-zinc-700 mb-2 animate-pulse" />
          <p className="font-semibold text-sm mb-1 text-zinc-400">No liked songs yet</p>
          <p className="text-xs text-zinc-650">Click the heart on any track to add it here!</p>
        </div>
      )}
    </div>
  );
};

// Main App Dashboard Layout
const MainLayout = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [showQueue, setShowQueue] = useState(false);

  // Helper to render current body panel view
  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <Home setActiveTab={setActiveTab} setSelectedPlaylistId={setSelectedPlaylistId} />;
      case 'search':
        return <Search searchQuery={searchQuery} setActiveTab={setActiveTab} />;
      case 'library':
        return <Library setActiveTab={setActiveTab} setSelectedPlaylistId={setSelectedPlaylistId} />;
      case 'favorites':
        return <FavoritesPage setActiveTab={setActiveTab} />;
      case 'playlist':
        return <PlaylistDetails playlistId={selectedPlaylistId} setActiveTab={setActiveTab} activeTab={activeTab} />;
      case 'admin':
        return <AdminPanel />;
      case 'login':
        return <Login setActiveTab={setActiveTab} />;
      default:
        return <Home setActiveTab={setActiveTab} setSelectedPlaylistId={setSelectedPlaylistId} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* Upper Main Section */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          setSelectedPlaylistId={setSelectedPlaylistId}
        />
        
        {/* Main Feed Content View */}
        <div className="flex-1 flex flex-col overflow-hidden bg-spotify-dark m-2 ml-0 rounded-lg">
          <Navbar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <div className="flex-1 flex overflow-hidden">
            {renderView()}
          </div>
        </div>

        {/* Right Queue Section */}
        {showQueue && (
          <div className="m-2 ml-0 rounded-lg overflow-hidden h-[calc(100%-16px)]">
            <Queue onClose={() => setShowQueue(false)} />
          </div>
        )}
      </div>

      {/* Bottom Audio Controller Bar */}
      <Player 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        showQueue={showQueue}
        setShowQueue={setShowQueue}
      />

    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <MainLayout />
      </AudioProvider>
    </AuthProvider>
  );
}

export default App;
