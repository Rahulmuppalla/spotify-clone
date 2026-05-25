import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Plus, Disc, CheckCircle, AlertTriangle, FileMusic, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { token, API_BASE } = useAuth();
  
  // Form states
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [duration, setDuration] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  
  // Status states
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }
  const [songs, setSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  // Fetch all songs to manage
  const fetchSongs = async () => {
    try {
      const res = await fetch(`${API_BASE}/songs`);
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch (err) {
      console.error('Error fetching admin tracks list:', err);
    } finally {
      setLoadingSongs(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile || !coverFile) {
      setStatusMsg({ type: 'error', text: 'Please select both audio and cover files.' });
      return;
    }

    setUploading(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('album', album || 'Single');
    if (duration) formData.append('duration', duration);
    formData.append('audio', audioFile);
    formData.append('cover', coverFile);

    try {
      const res = await fetch(`${API_BASE}/songs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Song uploaded successfully!' });
        // Clear fields
        setTitle('');
        setArtist('');
        setAlbum('');
        setDuration('');
        setAudioFile(null);
        setCoverFile(null);
        // Reset file inputs in DOM
        document.getElementById('audio-input').value = '';
        document.getElementById('cover-input').value = '';
        fetchSongs();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to upload song.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'A network error occurred.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSong = async (songId) => {
    if (!window.confirm('Are you sure you want to permanently delete this track? This deletes local source files.')) return;

    try {
      const res = await fetch(`${API_BASE}/songs/${songId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSongs(songs.filter(s => s.id !== songId));
      }
    } catch (err) {
      console.error('Error deleting song:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-spotify-dark p-6">
      <h1 className="text-3xl font-extrabold text-white mb-6 tracking-tight mt-2 flex items-center gap-2">
        <Disc className="w-8 h-8 text-spotify-green animate-spin-slow" />
        Admin Control Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Upload Form */}
        <div className="lg:col-span-1 bg-spotify-lightdark rounded-lg p-6 border border-zinc-800/80 shadow-lg h-fit">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-spotify-green" />
            Upload New Song
          </h2>

          {statusMsg && (
            <div className={`p-3 rounded text-sm font-semibold flex items-center gap-2 mb-4 ${
              statusMsg.type === 'success' ? 'bg-spotify-green/10 text-spotify-green border border-spotify-green/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-bold uppercase">Song Title *</label>
              <input
                type="text"
                placeholder="E.g. Synthwave Midnight"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-850 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-spotify-green"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-bold uppercase">Artist *</label>
              <input
                type="text"
                placeholder="E.g. Neon Horizon"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-zinc-850 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-spotify-green"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-bold uppercase">Album Name</label>
              <input
                type="text"
                placeholder="E.g. Cyber City (default Single)"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full bg-zinc-850 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-spotify-green"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-bold uppercase">Duration (seconds)</label>
              <input
                type="number"
                placeholder="E.g. 180"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-zinc-850 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-spotify-green"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-bold uppercase flex items-center gap-1">
                <FileMusic className="w-3.5 h-3.5" />
                Audio File (.mp3, .wav) *
              </label>
              <input
                id="audio-input"
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files[0])}
                className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 font-bold uppercase flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                Cover Image (.jpg, .png) *
              </label>
              <input
                id="cover-input"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files[0])}
                className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                required
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="mt-2 w-full py-2.5 bg-spotify-green hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold rounded-full transition duration-200 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 fill-current" />
                  Publish Song
                </>
              )}
            </button>

          </form>
        </div>

        {/* RIGHT: Catalog Manager List */}
        <div className="lg:col-span-2 bg-spotify-lightdark rounded-lg p-6 border border-zinc-800/80 shadow-lg flex flex-col h-[600px]">
          <h2 className="text-lg font-bold text-white mb-4">Catalogued Songs ({songs.length})</h2>

          {loadingSongs ? (
            <p className="text-zinc-500 text-sm py-4">Loading catalog...</p>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {songs.map((song) => {
                const coverUrl = song.cover_url.startsWith('/uploads/')
                  ? `http://localhost:5000${song.cover_url}`
                  : song.cover_url;

                return (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-850/50 rounded-lg border border-zinc-850 transition duration-200 group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <img src={coverUrl} alt="" className="w-12 h-12 object-cover rounded shadow" />
                      <div className="truncate">
                        <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">ID: {song.id}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteSong(song.id)}
                      className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 rounded-full transition duration-200"
                      title="Permanently Delete Song"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {songs.length === 0 && (
                <p className="text-zinc-500 text-xs text-center py-10">No tracks exist in the database.</p>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminPanel;
