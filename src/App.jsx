import { useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MusicProvider } from './context/MusicContext';
import { WasmProvider } from './hooks/useWasm.jsx';
import HomePage from './pages/HomePage';
import FavoritesPage from './pages/FavoritesPage';
import RecentPage from './pages/RecentPage';
import PlaylistPage from './pages/PlaylistPage';
import PlayerBar from './components/PlayerBar';

function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem('music-playlist-auth', JSON.stringify(user));
    } else {
      window.localStorage.removeItem('music-playlist-auth');
    }
  }, [user]);

  return (
    <WasmProvider>
      <MusicProvider user={user}>
        <div className="min-h-screen bg-[#04050a] text-slate-100">
          <div className="fixed inset-x-0 top-0 z-30 h-1 bg-transparent">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-600 via-cyan-500 to-fuchsia-500 transition-all" style={{ width: `${scrollProgress}%` }} />
          </div>
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-4 md:px-8">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs uppercase tracking-[0.3em] text-cyan-300 sm:text-sm sm:tracking-[0.4em]">Music Playlist Manager</p>
                <h1 className="text-lg font-semibold sm:text-xl"></h1>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <nav className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 overflow-x-auto">
                  <NavLink to="/" className={({ isActive }) => `rounded-full px-2 py-2 text-xs sm:px-3 sm:text-sm ${isActive ? 'bg-gradient-to-r from-purple-600 to-cyan-500' : 'text-slate-300'}`}>
                    Home
                  </NavLink>
                  <NavLink to="/playlist" className={({ isActive }) => `rounded-full px-2 py-2 text-xs sm:px-3 sm:text-sm ${isActive ? 'bg-gradient-to-r from-purple-600 to-cyan-500' : 'text-slate-300'}`}>
                    Playlist
                  </NavLink>
                  <NavLink to="/favorites" className={({ isActive }) => `rounded-full px-2 py-2 text-xs sm:px-3 sm:text-sm ${isActive ? 'bg-gradient-to-r from-purple-600 to-cyan-500' : 'text-slate-300'}`}>
                    Favorites
                  </NavLink>
                  <NavLink to="/recent" className={({ isActive }) => `rounded-full px-2 py-2 text-xs sm:px-3 sm:text-sm ${isActive ? 'bg-gradient-to-r from-purple-600 to-cyan-500' : 'text-slate-300'}`}>
                    Recent
                  </NavLink>
                </nav>

              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 md:px-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/playlist" element={<PlaylistPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/recent" element={<RecentPage />} />
            </Routes>
          </main>

          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky bottom-0 z-20">
            <PlayerBar />
          </motion.div>
        </div>
      </MusicProvider>
    </WasmProvider>
  );
}

export default App;
