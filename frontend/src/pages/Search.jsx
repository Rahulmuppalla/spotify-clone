import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Play, Pause, Heart, Clock } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { ListSkeleton } from '../components/Skeleton';
import PlaylistModal from '../components/PlaylistModal';

const Search = ({ searchQuery, setActiveTab }) => {
  const { token, API_BASE } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay } = useAudio();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);

  // Trigger search on query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/songs/search?q=${encodeURIComponent(searchQuery)}`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Error searching:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, token]);

  const handlePlaySong = (song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song, results);
    }
  };

  const handleLikeSong = async (song, idx) => {
    if (!token) {
      setActiveTab('login');
      return;
    }

    const isLiked = song.is_liked;
    const url = `${API_BASE}/me/favorites/${song.id}`;
    const method = isLiked ? 'DELETE' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Update results local state
        const updated = [...results];
        updated[idx] = { ...song, is_liked: !isLiked };
        setResults(updated);
      }
    } catch (err) {
      console.error('Error liking song:', err);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Mock Spotify browse categories
  const browseCategories = [
    { title: 'Podcasts', bg: 'bg-emerald-700', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&q=80' },
    { title: 'New Releases', bg: 'bg-pink-700', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80' },
    { title: 'Charts', bg: 'bg-indigo-700', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80' },
    { title: 'Live Events', bg: 'bg-amber-600', img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&q=80' },
    { title: 'Pop', bg: 'bg-sky-600', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80' },
    { title: 'Hip-Hop', bg: 'bg-orange-700', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=200&q=80' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-spotify-dark p-6">
      
      {/* If search query is empty: show Browse Categories */}
      {!searchQuery.trim() ? (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 mt-2">Browse All</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {browseCategories.map((cat, i) => (
              <div 
                key={i} 
                className={`${cat.bg} aspect-square rounded-lg p-4 relative overflow-hidden group cursor-pointer hover:brightness-110 transition duration-300 shadow-md`}
              >
                <span className="text-lg font-bold text-white break-words leading-tight block w-2/3">{cat.title}</span>
                <img 
                  src={cat.img} 
                  alt="" 
                  className="w-16 h-16 object-cover absolute -bottom-2 -right-2 rotate-25 shadow-lg group-hover:scale-110 transition duration-300"
                  style={{ transform: 'rotate(25deg)' }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* If search query has value: show results */
        <div>
          <h2 className="text-xl font-bold text-white mb-4 mt-2">Search Results</h2>
          
          {loading ? (
            <ListSkeleton count={6} />
          ) : results.length > 0 ? (
            <div className="bg-zinc-900/30 rounded-lg p-4 border border-zinc-900/40">
              
              {/* Table header */}
              <div className="flex items-center text-xs text-zinc-500 font-bold uppercase tracking-wider px-2 py-2 border-b border-zinc-800/60 mb-2">
                <span className="w-8 text-center shrink-0">#</span>
                <span className="flex-1">Title</span>
                <span className="w-1/3 hidden md:block">Album</span>
                <span className="w-16 text-center shrink-0">
                  <Clock className="w-4 h-4 mx-auto" />
                </span>
                <span className="w-12 shrink-0"></span>
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-0.5">
                {results.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id;
                  const coverUrl = song.cover_url.startsWith('/uploads/')
                    ? `http://localhost:5000${song.cover_url}`
                    : song.cover_url;

                  return (
                    <div 
                      key={song.id}
                      onClick={() => handlePlaySong(song)}
                      className={`flex items-center px-2 py-2 rounded-md hover:bg-zinc-850/70 transition duration-200 group cursor-pointer ${
                        isCurrent ? 'bg-zinc-800/40' : ''
                      }`}
                    >
                      {/* Index / Hover play */}
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

                      {/* Song Title, Artist & Cover */}
                      <div className="flex-1 min-w-0 flex items-center gap-3 pr-4">
                        <img src={coverUrl} alt="" className="w-10 h-10 object-cover rounded shadow" />
                        <div className="truncate">
                          <p className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-spotify-green' : 'text-white'
                          }`}>{song.title}</p>
                          <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                        </div>
                      </div>

                      {/* Album */}
                      <div className="w-1/3 hidden md:block text-sm text-zinc-400 truncate">
                        {song.album}
                      </div>

                      {/* Duration */}
                      <div className="w-16 text-center text-xs text-zinc-400 shrink-0 font-medium">
                        {formatTime(song.duration)}
                      </div>

                      {/* Actions */}
                      <div className="w-12 shrink-0 flex items-center justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeSong(song, idx);
                          }}
                          className="text-zinc-400 hover:text-white transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Heart className={`w-4 h-4 ${song.is_liked ? 'text-spotify-green fill-current' : ''}`} />
                        </button>
                        {token && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSongForPlaylist(song.id);
                            }}
                            className="text-zinc-500 hover:text-white font-extrabold text-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                            title="Add to Playlist"
                          >
                            +
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-10">No tracks found matching "{searchQuery}"</p>
          )}
        </div>
      )}

      {selectedSongForPlaylist && (
        <PlaylistModal
          songId={selectedSongForPlaylist}
          onClose={() => setSelectedSongForPlaylist(null)}
        />
      )}
    </div>
  );
};

export default Search;
