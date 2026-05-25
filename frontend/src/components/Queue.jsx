import React from 'react';
import { Play, Pause, Music, X } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

const Queue = ({ onClose }) => {
  const { queue, currentIndex, currentSong, isPlaying, playSong, togglePlay } = useAudio();

  const handleSongClick = (song, idx) => {
    // Play selected song using our queue
    playSong(song, queue);
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <aside className="w-80 bg-spotify-lightdark border-l border-zinc-900 flex flex-col h-full text-zinc-400 select-none z-30">
      
      {/* Queue Header */}
      <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
        <h3 className="text-white font-bold text-base">Play Queue</h3>
        <button 
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition"
          title="Close Queue"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Queue Scroll List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        {/* Now Playing Section */}
        {currentSong && (
          <div>
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Now Playing</h4>
            <div className="flex items-center gap-3 p-2 bg-zinc-850 rounded-lg border border-zinc-800">
              <img 
                src={currentSong.cover_url.startsWith('/uploads/') ? `http://localhost:5000${currentSong.cover_url}` : currentSong.cover_url} 
                alt="" 
                className="w-10 h-10 object-cover rounded shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-spotify-green truncate">{currentSong.title}</p>
                <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
              </div>
              <button 
                onClick={togglePlay} 
                className="text-white p-1.5 hover:bg-zinc-800 rounded-full transition"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
            </div>
          </div>
        )}

        {/* Next Up Section */}
        <div>
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Next Up</h4>
          <div className="flex flex-col gap-1">
            {queue.slice(currentIndex + 1).map((song, sliceIdx) => {
              const actualIdx = currentIndex + 1 + sliceIdx;
              const isCurrent = actualIdx === currentIndex;
              const coverUrl = song.cover_url.startsWith('/uploads/') 
                ? `http://localhost:5000${song.cover_url}` 
                : song.cover_url;

              return (
                <div
                  key={`${song.id}-${actualIdx}`}
                  onClick={() => handleSongClick(song, actualIdx)}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/60 cursor-pointer transition group"
                >
                  <span className="text-xs text-zinc-500 w-4 text-right group-hover:hidden">
                    {sliceIdx + 1}
                  </span>
                  <span className="w-4 hidden group-hover:flex items-center justify-center text-white">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </span>

                  <img src={coverUrl} alt="" className="w-9 h-9 object-cover rounded shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-spotify-green">
                      {song.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                  </div>
                  
                  <span className="text-xs text-zinc-500 pr-1 shrink-0">
                    {formatTime(song.duration)}
                  </span>
                </div>
              );
            })}

            {queue.slice(currentIndex + 1).length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-4">Queue is empty</p>
            )}
          </div>
        </div>

      </div>

    </aside>
  );
};

export default Queue;
