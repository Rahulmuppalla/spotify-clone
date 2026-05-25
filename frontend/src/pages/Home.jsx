import React, { useState, useEffect } from 'react';
import { Play, Pause, Heart, Clock, Music } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { GridSkeleton } from '../components/Skeleton';
import PlaylistModal from '../components/PlaylistModal';

const Home = ({ setActiveTab, setSelectedPlaylistId }) => {
  const { token, API_BASE } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay } = useAudio();

  const [trendingSongs, setTrendingSongs] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch trending songs
      const trendingRes = await fetch(`${API_BASE}/songs/trending`, { headers });
      const trendingData = await trendingRes.ok ? await trendingRes.json() : [];
      setTrendingSongs(trendingData);

      // 2. Fetch all songs
      const allRes = await fetch(`${API_BASE}/songs`, { headers });
      const allData = await allRes.ok ? await allRes.json() : [];
      setAllSongs(allData);

      // 3. Fetch recently played if logged in
      if (token) {
        const recentRes = await fetch(`${API_BASE}/me/recently-played`, { headers });
        const recentData = await recentRes.ok ? await recentRes.json() : [];
        setRecentSongs(recentData);
      }
    } catch (err) {
      console.error('Error fetching home page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, currentSong]); // Refresh on song change to update recently played

  const handlePlaySong = (song, queue) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song, queue);
    }
  };

  const handleLikeSong = async (song, idx, section) => {
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
        // Local state mutation for immediate feedback
        const updateList = (list) =>
          list.map((s) => (s.id === song.id ? { ...s, is_liked: !isLiked } : s));

        if (section === 'trending') setTrendingSongs(updateList(trendingSongs));
        if (section === 'all') setAllSongs(updateList(allSongs));
        if (section === 'recent') setRecentSongs(updateList(recentSongs));
      }
    } catch (err) {
      console.error('Error liking song:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800 to-spotify-dark p-6 relative">
      {/* Top Banner Greeting */}
      <h1 className="text-3xl font-extrabold text-white mb-6 tracking-tight mt-2">{getGreeting()}</h1>

      {loading ? (
        <div className="flex flex-col gap-8">
          <div>
            <div className="h-6 bg-zinc-800 rounded w-48 mb-4 animate-pulse"></div>
            <GridSkeleton count={6} />
          </div>
          <div>
            <div className="h-6 bg-zinc-800 rounded w-48 mb-4 animate-pulse"></div>
            <GridSkeleton count={6} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Recently Played grid (Short Cards) */}
          {token && recentSongs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4 hover:underline cursor-pointer">Recently Played</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentSongs.slice(0, 6).map((song) => {
                  const isCurrent = currentSong?.id === song.id;
                  const coverUrl = song.cover_url.startsWith('/uploads/')
                    ? `http://localhost:5000${song.cover_url}`
                    : song.cover_url;

                  return (
                    <div
                      key={`recent-${song.id}`}
                      className="bg-zinc-800/40 hover:bg-zinc-700/50 rounded-md overflow-hidden flex items-center justify-between pr-4 group transition duration-300 shadow cursor-pointer"
                      onClick={() => handlePlaySong(song, recentSongs)}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <img src={coverUrl} alt="" className="w-16 h-16 object-cover shadow shrink-0" />
                        <span className="font-semibold text-sm text-white truncate">{song.title}</span>
                      </div>
                      
                      {/* Hover Play Button */}
                      <button
                        className="w-10 h-10 rounded-full bg-spotify-green text-black flex items-center justify-center shadow opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trending Songs Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white hover:underline cursor-pointer">Trending Tracks</h2>
              <button onClick={() => setActiveTab('search')} className="text-xs text-zinc-400 font-bold hover:underline">
                SEE ALL
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {trendingSongs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                const coverUrl = song.cover_url.startsWith('/uploads/')
                  ? `http://localhost:5000${song.cover_url}`
                  : song.cover_url;

                return (
                  <div
                    key={`trending-${song.id}`}
                    className="bg-spotify-lightdark p-4 rounded-md hover:bg-zinc-800/80 transition duration-300 group shadow-md cursor-pointer relative"
                    onClick={() => handlePlaySong(song, trendingSongs)}
                  >
                    {/* Cover Photo */}
                    <div className="relative aspect-square w-full rounded-md overflow-hidden mb-4 shadow-md bg-zinc-850">
                      <img src={coverUrl} alt={song.title} className="w-full h-full object-cover" />
                      
                      {/* Play Button Overlay */}
                      <button
                        className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-spotify-green text-black flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300"
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="min-h-[62px]">
                      <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                      <p className="text-xs text-zinc-400 truncate mt-1">{song.artist}</p>
                    </div>

                    {/* Like & Add Actions */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/40 opacity-0 group-hover:opacity-100 transition duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeSong(song, idx, 'trending');
                        }}
                        className="text-zinc-400 hover:text-white transition"
                      >
                        <Heart className={`w-4 h-4 ${song.is_liked ? 'text-spotify-green fill-current' : ''}`} />
                      </button>
                      
                      {token && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSongForPlaylist(song.id);
                          }}
                          className="text-xs text-zinc-500 hover:text-white font-bold"
                        >
                          + Playlist
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {trendingSongs.length === 0 && (
                <p className="text-sm text-zinc-500 col-span-full py-6 text-center">No trending music catalogued yet.</p>
              )}
            </div>
          </div>

          {/* Catalog / All Tracks */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Discover Music</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {allSongs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                const coverUrl = song.cover_url.startsWith('/uploads/')
                  ? `http://localhost:5000${song.cover_url}`
                  : song.cover_url;

                return (
                  <div
                    key={`all-${song.id}`}
                    className="bg-spotify-lightdark p-4 rounded-md hover:bg-zinc-800/80 transition duration-300 group shadow-md cursor-pointer relative"
                    onClick={() => handlePlaySong(song, allSongs)}
                  >
                    <div className="relative aspect-square w-full rounded-md overflow-hidden mb-4 shadow-md bg-zinc-850">
                      <img src={coverUrl} alt={song.title} className="w-full h-full object-cover" />
                      <button
                        className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-spotify-green text-black flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300"
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="min-h-[62px]">
                      <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                      <p className="text-xs text-zinc-400 truncate mt-1">{song.artist}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/40 opacity-0 group-hover:opacity-100 transition duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeSong(song, idx, 'all');
                        }}
                        className="text-zinc-400 hover:text-white transition"
                      >
                        <Heart className={`w-4 h-4 ${song.is_liked ? 'text-spotify-green fill-current' : ''}`} />
                      </button>
                      
                      {token && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSongForPlaylist(song.id);
                          }}
                          className="text-xs text-zinc-500 hover:text-white font-bold"
                        >
                          + Playlist
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {allSongs.length === 0 && (
                <p className="text-sm text-zinc-500 col-span-full py-6 text-center">No music catalogued yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Playlist add modal */}
      {selectedSongForPlaylist && (
        <PlaylistModal
          songId={selectedSongForPlaylist}
          onClose={() => setSelectedSongForPlaylist(null)}
        />
      )}
    </div>
  );
};

export default Home;
