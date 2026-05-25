import React from 'react';
import { ChevronLeft, ChevronRight, User, Search, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activeTab, setActiveTab, searchQuery, setSearchQuery }) => {
  const { user, token } = useAuth();

  return (
    <header className="h-16 bg-zinc-900/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30 sticky top-0 border-b border-zinc-900/30">
      
      {/* Navigation history arrows + Search box (if search tab) */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2 text-zinc-400">
          <button className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center cursor-not-allowed">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center cursor-not-allowed">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {activeTab === 'search' && (
          <div className="relative w-full max-w-sm ml-2">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="What do you want to listen to?" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800 border-none rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/55 font-medium placeholder-zinc-500"
            />
          </div>
        )}
      </div>

      {/* Profile menu / Authentication buttons */}
      <div className="flex items-center gap-3">
        {token ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold hidden md:inline">{user?.username}</span>
            <button 
              onClick={() => setActiveTab('library')}
              className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition"
              title="Profile"
            >
              <User className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('login')} 
              className="text-zinc-400 hover:text-white font-bold text-sm transition"
            >
              Sign up
            </button>
            <button 
              onClick={() => setActiveTab('login')} 
              className="bg-white text-black font-bold text-sm px-6 py-2 rounded-full hover:scale-105 transition duration-200"
            >
              Log in
            </button>
          </div>
        )}
      </div>

    </header>
  );
};

export default Navbar;
