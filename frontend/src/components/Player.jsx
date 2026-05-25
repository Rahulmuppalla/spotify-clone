import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, RotateCcw, 
  Volume2, Volume1, VolumeX, Heart, ListMusic, Repeat, Maximize2 
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';

const Player = ({ activeTab, setActiveTab, showQueue, setShowQueue }) => {
  const { token, API_BASE } = useAuth();
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffle,
    repeatMode,
    analyserNode,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    toggleShuffle,
    toggleRepeat,
    setVolume
  } = useAudio();

  const [isLiked, setIsLiked] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Sync liked state when song changes
  useEffect(() => {
    if (currentSong) {
      setIsLiked(currentSong.is_liked);
    }
  }, [currentSong]);

  // Handle Like Toggle
  const handleLikeToggle = async () => {
    if (!token || !currentSong) return;
    const url = `${API_BASE}/me/favorites/${currentSong.id}`;
    const method = isLiked ? 'DELETE' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setIsLiked(!isLiked);
        // Mutate original song reference if we want
        currentSong.is_liked = !isLiked;
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Web Audio Visualizer canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 110 * dpr;
    canvas.height = 36 * dpr;
    ctx.scale(dpr, dpr);
    
    const w = 110;
    const h = 36;

    if (!analyserNode || !isPlaying) {
      // Idle drawing: simple static waves
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(113, 113, 122, 0.4)'; // Zinc-500 transparency
      const numBars = 20;
      const barSpacing = 4;
      const barW = (w - (numBars - 1) * barSpacing) / numBars;
      for (let i = 0; i < numBars; i++) {
        // Draw standard small flat bars
        const staticH = 4 + Math.sin(i * 0.4) * 6;
        ctx.fillRect(i * (barW + barSpacing), (h - staticH) / 2, barW, staticH);
      }
      return;
    }

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) return;
      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, w, h);

      const numBars = 16;
      const barSpacing = 5;
      const barW = (w - (numBars - 1) * barSpacing) / numBars;
      
      // Draw frequency spectrum
      for (let i = 0; i < numBars; i++) {
        // Map data from index ranges
        const dataIdx = Math.floor((i / numBars) * bufferLength * 0.6); // Look at lower 60% of frequencies
        const rawValue = dataArray[dataIdx] || 0;
        const mappedH = (rawValue / 255) * h * 0.95 + 3; // Ensure tiny min height

        // Gradient color for Spotify theme
        ctx.fillStyle = '#1db954';
        
        // Render rounded bars
        const barX = i * (barW + barSpacing);
        const barY = h - mappedH;
        
        ctx.fillRect(barX, barY, barW, mappedH);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isPlaying, currentSong]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleProgressChange = (e) => {
    seek(parseFloat(e.target.value));
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Volume icon renderer
  const renderVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="w-5 h-5 text-zinc-500" />;
    if (volume < 0.4) return <Volume1 className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
  };

  if (!currentSong) return null;

  // Map local audio cover path if dynamic upload
  const coverUrl = currentSong.cover_url.startsWith('/uploads/')
    ? `http://localhost:5000${currentSong.cover_url}`
    : currentSong.cover_url;

  return (
    <div className="h-24 bg-zinc-950 border-t border-zinc-900 px-4 flex items-center justify-between z-40 relative select-none">
      
      {/* LEFT: Current Track Details */}
      <div className="flex items-center gap-3 w-1/3 min-w-[200px]">
        <img 
          src={coverUrl} 
          alt={currentSong.title} 
          className="w-14 h-14 rounded-md object-cover shadow-lg hover:scale-105 transition duration-300"
        />
        <div className="truncate max-w-[150px]">
          <h4 className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">{currentSong.title}</h4>
          <p className="text-xs text-zinc-400 truncate hover:text-white cursor-pointer">{currentSong.artist}</p>
        </div>
        
        {token && (
          <button 
            onClick={handleLikeToggle}
            className="text-zinc-400 hover:text-white transition duration-200 ml-2"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'text-spotify-green fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* CENTER: Main Player Controls */}
      <div className="flex flex-col items-center gap-1.5 w-1/3 max-w-[500px]">
        {/* Buttons */}
        <div className="flex items-center gap-5">
          <button 
            onClick={toggleShuffle} 
            className={`transition duration-200 ${isShuffle ? 'text-spotify-green' : 'text-zinc-400 hover:text-white'}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button 
            onClick={prevTrack} 
            className="text-zinc-400 hover:text-white transition duration-200"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={togglePlay} 
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition duration-200 shadow"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          
          <button 
            onClick={nextTrack} 
            className="text-zinc-400 hover:text-white transition duration-200"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={toggleRepeat} 
            className={`transition duration-200 relative ${
              repeatMode !== 'none' ? 'text-spotify-green' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Repeat mode: ${repeatMode}`}
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-spotify-green text-black font-extrabold rounded-full px-0.5 scale-75">1</span>
            )}
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex items-center gap-3 w-full text-xs text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <div className="relative group flex-1 flex items-center">
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleProgressChange}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-spotify-green focus:outline-none transition"
              style={{
                background: `linear-gradient(to right, #1db954 0%, #1db954 ${progressPercent}%, #3f3f46 ${progressPercent}%, #3f3f46 100%)`
              }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT: Visualizer & Volume */}
      <div className="flex items-center justify-end gap-4 w-1/3 min-w-[200px]">
        {/* Glow visualizer */}
        <div className="relative h-9 w-28 overflow-hidden rounded bg-zinc-900/40 border border-zinc-900/80 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-[110px] h-[36px] bg-transparent opacity-90" />
        </div>

        {/* Queue Display Toggle */}
        <button 
          onClick={() => setShowQueue(!showQueue)}
          className={`transition duration-200 ${showQueue ? 'text-spotify-green' : 'text-zinc-400 hover:text-white'}`}
          title="Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
            className="text-zinc-400 hover:text-white transition duration-200"
          >
            {renderVolumeIcon()}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01"
            value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-spotify-green focus:outline-none transition"
            style={{
              background: `linear-gradient(to right, #1db954 0%, #1db954 ${volume * 100}%, #3f3f46 ${volume * 100}%, #3f3f46 100%)`
            }}
          />
        </div>
      </div>

    </div>
  );
};

export default Player;
