import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Disc, AlertCircle, ArrowRight } from 'lucide-react';

const Login = ({ setActiveTab }) => {
  const { login, register, error, loading } = useAuth();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (isRegisterMode) {
      if (!username.trim() || !email.trim() || !password.trim()) {
        setLocalError('All fields are required.');
        return;
      }
      const success = await register(username, email, password);
      if (success) {
        setActiveTab('home');
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setLocalError('Email and password are required.');
        return;
      }
      const success = await login(email, password);
      if (success) {
        setActiveTab('home');
      }
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center p-6 select-none overflow-y-auto">
      <div className="bg-spotify-lightdark border border-zinc-800 rounded-lg p-8 w-full max-w-md shadow-2xl flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="flex items-center gap-2 cursor-pointer mb-6" onClick={() => setActiveTab('home')}>
          <Disc className="w-10 h-10 text-spotify-green animate-spin-slow" />
          <span className="text-white text-2xl font-black tracking-tight">Spotify<span className="text-spotify-green">.</span></span>
        </div>

        <h2 className="text-xl font-bold text-white mb-6 text-center">
          {isRegisterMode ? 'Sign up for a free account' : 'To continue, log in to Spotify.'}
        </h2>

        {/* Error Banners */}
        {(error || localError) && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs font-semibold flex items-center gap-2 mb-6 w-full">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          {isRegisterMode && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase">What should we call you?</label>
              <input
                type="text"
                placeholder="Enter a profile name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-850 border border-zinc-800 rounded p-3 text-sm text-white focus:outline-none focus:border-spotify-green"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase">What is your email?</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-850 border border-zinc-800 rounded p-3 text-sm text-white focus:outline-none focus:border-spotify-green"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase">Password</label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-850 border border-zinc-800 rounded p-3 text-sm text-white focus:outline-none focus:border-spotify-green"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-spotify-green hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-extrabold rounded-full transition duration-200 shadow-md flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {isRegisterMode ? 'Get Started' : 'Log In'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full h-[1px] bg-zinc-800 my-6"></div>

        {/* Mode Switcher */}
        <div className="text-center">
          <span className="text-zinc-400 text-xs font-semibold mr-1.5">
            {isRegisterMode ? 'Already have an account?' : 'Don\'t have an account?'}
          </span>
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setLocalError(null);
            }}
            className="text-white hover:text-spotify-green font-bold text-xs underline transition"
          >
            {isRegisterMode ? 'Log in here' : 'Sign up for Spotify'}
          </button>
        </div>

        {/* Quick Demo Credentials Footer */}
        {!isRegisterMode && (
          <div className="mt-8 p-3 bg-zinc-900 rounded-md border border-zinc-850 w-full text-[11px] text-zinc-500 flex flex-col gap-1">
            <p className="font-bold text-zinc-400">💡 Quick Demo Logins:</p>
            <p>• Admin Access: <code className="text-zinc-350 bg-zinc-950 px-1 py-0.5 rounded">admin@spotify.com</code> / <code className="text-zinc-350 bg-zinc-950 px-1 py-0.5 rounded">password123</code></p>
            <p>• Listener Access: <code className="text-zinc-350 bg-zinc-950 px-1 py-0.5 rounded">user@spotify.com</code> / <code className="text-zinc-350 bg-zinc-950 px-1 py-0.5 rounded">password123</code></p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
