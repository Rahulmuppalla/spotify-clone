import React, { useState, useEffect } from 'react';
import { Heart, Music, Play, ListMusic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { GridSkeleton } from '../components/Skeleton';

const Library = ({ setActiveTab, setSelectedPlaylistId }) => {
  const { token, API_BASE } = useAuth();
  const { playSong } = useAudio();
  const [playlists, setPlaylists] = useState([]);
  const [likedCount, setLikedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch playlists
        const playlistsRes = await fetch(`${API_BASE}/playlists`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const playlistsData = playlistsRes.ok ? await playlistsRes.json() : [];
        setPlaylists(playlistsData);

        // 2. Fetch liked songs count
        const favoritesRes = await fetch(`${API_BASE}/me/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const favoritesData = favoritesRes.ok ? await favoritesRes.json() : [];
        setLikedCount(favoritesData.length);
      } catch (err) {
        console.error('Error fetching library details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, [token]);

  const handlePlaylistClick = (id) => {
    setSelectedPlaylistId(id);
    setActiveTab('playlist');
  };

  if (!token) {
    return (
      <div className="flex-1 bg-spotify-dark flex flex-col items-center justify-center p-6 text-center select-none">
        <ListMusic className="w-16 h-16 text-zinc-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Enjoy Your Library</h2>
        <p className="text-sm text-zinc-400 max-w-xs mb-6">
          Log in to view and manage your playlists, favorite tracks, and personalized recommendations.
        </p>
        <button 
          onClick={() => setActiveTab('login')}
          className="bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition duration-200 shadow-md text-sm"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-spotify-dark p-6">
      <h1 className="text-3xl font-extrabold text-white mb-6 tracking-tight mt-2">Your Library</h1>

      {loading ? (
        <GridSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          
          {/* Liked Songs Tile (Takes 2 grid columns on medium+ viewports, standard Spotify design!) */}
          <div 
            onClick={() => setActiveTab('favorites')}
            className="col-span-2 bg-gradient-to-br from-indigo-800 via-purple-700 to-pink-500 rounded-md p-6 flex flex-col justify-between group cursor-pointer shadow-lg hover:brightness-105 hover:-translate-y-0.5 transition duration-300 relative"
          >
            <div className="flex justify-end pr-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur shadow-sm">
                <Heart className="w-6 h-6 fill-current text-white" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-tight mb-2">Liked Songs</h2>
              <p className="text-sm text-zinc-200 font-semibold">{likedCount} favorite tracks</p>
            </div>

            {/* Hover Play Button */}
            {likedCount > 0 && (
              <button 
                className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-spotify-green text-black flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('favorites');
                }}
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>
            )}
          </div>

          {/* User Playlists grid list */}
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => handlePlaylistClick(playlist.id)}
              className="bg-spotify-lightdark p-4 rounded-md hover:bg-zinc-800 transition duration-300 group shadow-md cursor-pointer relative flex flex-col"
            >
              {/* Cover Photo */}
              <div className="relative aspect-square w-full rounded-md overflow-hidden mb-4 shadow-md bg-zinc-850">
                {playlist.cover_url ? (
                  <img src={playlist.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <Music className="w-8 h-8 text-zinc-500" />
                  </div>
                )}
                
                {/* Play Button Overlay */}
                {playlist.song_count > 0 && (
                  <button
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-spotify-green text-black flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                )}
              </div>

              {/* Metadata */}
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white truncate">{playlist.name}</h4>
                <p className="text-xs text-zinc-400 truncate mt-1 text-line-clamp-2 leading-relaxed">
                  {playlist.description || `Playlist by user`}
                </p>
              </div>

              {/* Songs count footer */}
              <div className="mt-4 pt-2 border-t border-zinc-800/40 text-xs text-zinc-500">
                {playlist.song_count} songs
              </div>
            </div>
          ))}

        </div>
      )}

    </div>
  );
};

export default Library;
