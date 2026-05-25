import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const { token, API_BASE } = useAuth();
  
  // HTML5 Audio Reference
  const audioRef = useRef(null);
  
  // Web Audio API References for Visualizer
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  // Queue and Playback States
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [originalQueue, setOriginalQueue] = useState([]); // Keeps order for un-shuffling
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // Controls
  const [volume, setVolume] = useState(parseFloat(localStorage.getItem('volume')) || 0.7);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none' | 'all' | 'one'
  
  // Timeline State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize Audio object on mount
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous'; // Important for AnalyserNode CORS
    audioRef.current = audio;

    // Event Listeners
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      handleNextTrack();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [currentIndex, queue, repeatMode]);

  // Set initial volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Setup Web Audio API Analyzer (runs lazily on user interaction)
  const setupWebAudio = () => {
    if (audioCtxRef.current) return; // Already initialized

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128; // 64 frequency bars

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (e) {
      console.warn('Web Audio API not fully supported or restricted by browser:', e);
    }
  };

  // Play a specific song and initialize a queue if provided
  const playSong = async (song, newQueue = []) => {
    if (!audioRef.current || !song) return;

    setupWebAudio();
    
    // Resume context if suspended (browser security policy)
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const isNewSong = !currentSong || currentSong.id !== song.id;

    if (newQueue.length > 0) {
      setOriginalQueue(newQueue);
      if (isShuffle) {
        // Create shuffled queue preserving the current song at index 0
        const filtered = newQueue.filter(s => s.id !== song.id);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        const finalQueue = [song, ...shuffled];
        setQueue(finalQueue);
        setCurrentIndex(0);
      } else {
        setQueue(newQueue);
        const idx = newQueue.findIndex(s => s.id === song.id);
        setCurrentIndex(idx !== -1 ? idx : 0);
      }
    } else if (isNewSong) {
      // Add single song to queue if not present
      const idx = queue.findIndex(s => s.id === song.id);
      if (idx !== -1) {
        setCurrentIndex(idx);
      } else {
        const newQ = [...queue, song];
        setQueue(newQ);
        setOriginalQueue(newQ);
        setCurrentIndex(newQ.length - 1);
      }
    }

    setCurrentSong(song);

    if (isNewSong) {
      // Map relative URL to full backend URL if local upload
      const songUrl = song.audio_url.startsWith('/uploads/')
        ? `http://localhost:5000${song.audio_url}`
        : song.audio_url;

      audioRef.current.src = songUrl;
      audioRef.current.load();
      
      // Record recently played track
      recordRecentlyPlayed(song.id);
    }

    try {
      await audioRef.current.play();
    } catch (err) {
      console.error('Audio play failure:', err);
    }
  };

  // Record recently played track on backend
  const recordRecentlyPlayed = async (songId) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/me/recently-played/${songId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error recording history:', err);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    setupWebAudio();

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error(e));
    }
  };

  const seek = (time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleNextTrack = () => {
    if (repeatMode === 'one') {
      // Play same song again
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error(e));
      }
      return;
    }

    if (queue.length === 0 || currentIndex === -1) return;

    let nextIdx = currentIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        // End of queue and no repeat
        setIsPlaying(false);
        return;
      }
    }

    setCurrentIndex(nextIdx);
    playSong(queue[nextIdx]);
  };

  const handlePrevTrack = () => {
    if (queue.length === 0 || currentIndex === -1) return;

    // If current song is > 3 seconds, restart it instead of prev song
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }

    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      if (repeatMode === 'all') {
        prevIdx = queue.length - 1;
      } else {
        // Stay at index 0 and restart
        seek(0);
        return;
      }
    }

    setCurrentIndex(prevIdx);
    playSong(queue[prevIdx]);
  };

  // Handle shuffle toggle
  const toggleShuffle = () => {
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);

    if (nextShuffle && currentSong) {
      // Shuffle the rest of the queue
      const filtered = originalQueue.filter(s => s.id !== currentSong.id);
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      const newQueue = [currentSong, ...shuffled];
      setQueue(newQueue);
      setCurrentIndex(0);
    } else if (currentSong) {
      // Revert to original queue order
      setQueue(originalQueue);
      const idx = originalQueue.findIndex(s => s.id === currentSong.id);
      setCurrentIndex(idx !== -1 ? idx : 0);
    }
  };

  // Handle repeat toggle
  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  // Add song to current queue
  const addToQueue = (song) => {
    if (queue.some(s => s.id === song.id)) return; // Already in queue
    const newQ = [...queue, song];
    setQueue(newQ);
    setOriginalQueue([...originalQueue, song]);
    if (queue.length === 0) {
      setCurrentSong(song);
      setCurrentIndex(0);
    }
  };

  const handleVolumeChange = (v) => {
    const vol = Math.max(0, Math.min(1, v));
    setVolume(vol);
    localStorage.setItem('volume', vol);
  };

  return (
    <AudioContext.Provider value={{
      currentSong,
      isPlaying,
      queue,
      currentIndex,
      currentTime,
      duration,
      volume,
      isShuffle,
      repeatMode,
      analyserNode: analyserRef.current, // Expose for visualizer component
      playSong,
      togglePlay,
      nextTrack: handleNextTrack,
      prevTrack: handlePrevTrack,
      seek,
      toggleShuffle,
      toggleRepeat,
      addToQueue,
      setVolume: handleVolumeChange
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
export default AudioContext;
