import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaHeart, FaPlus, FaPlay, FaSearch } from 'react-icons/fa';
import Visualizer3D from '../components/Visualizer3D';
import { useMusic } from '../context/MusicContext';

export default function HomePage() {
  const {
    songs,
    songMap,
    searchQuery,
    setSearchQuery,
    searchResults,
    playSong,
    addToPlaylist,
    toggleFavorite,
    favoritesIds,
    playlistIds,
    currentSong,
    addUserSong,
    removeUserSong,
    loading,
    error,
  } = useMusic();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSongData, setNewSongData] = useState({ title: '', artist: '', genre: '', audio: '', cover: '', audioFile: null, coverFile: null });
  const [addError, setAddError] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const capitalize = (text) => String(text || '').split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const genres = Array.from(new Set(songs.flatMap((s) => (String(s.genre || '').split(',').map((g) => g.trim()).filter(Boolean).map((g) => g.toLowerCase()))))).filter(Boolean).sort();

  const visibleSongs = (() => {
    const base = (searchQuery.trim() ? searchResults : songs)
      .map((entry) => (typeof entry === 'string' ? songMap[entry] ?? songs.find((song) => song.id === entry) : entry))
      .filter(Boolean);
    if (!genreFilter) return base;
    const gf = genreFilter.toLowerCase();
    return base.filter((song) => String(song.genre || '').toLowerCase().split(',').map((g) => g.trim()).includes(gf));
  })();

  if (loading) {
    return <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">Loading WASM module…</div>;
  }

  if (error) {
    return <div className="rounded-[2rem] border border-red-500/40 bg-red-500/10 p-8 text-red-300">WASM failed to load: {String(error)}</div>;
  }

  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const resetAddForm = () => {
    setNewSongData({ title: '', artist: '', genre: '', audio: '', cover: '', audioFile: null, coverFile: null });
    setAddError('');
  };

  const handleAddSong = async (event) => {
    event.preventDefault();
    setAddError('');
    try {
      const title = newSongData.title.trim();
      if (!title) {
        setAddError('Please provide a title.');
        return;
      }

      let audioValue = newSongData.audio.trim();
      if (newSongData.audioFile) {
        audioValue = await readFileAsDataUrl(newSongData.audioFile);
      }
      if (!audioValue) {
        setAddError('Please provide an audio file or URL.');
        return;
      }

      let coverValue = newSongData.cover.trim();
      if (newSongData.coverFile) {
        coverValue = await readFileAsDataUrl(newSongData.coverFile);
      }
      if (!coverValue) {
        coverValue = '/images/default-cover.jpg';
      }

      addUserSong({
        title,
        artist: newSongData.artist.trim(),
        genre: newSongData.genre.trim(),
        audio: audioValue,
        cover: coverValue,
      });
      resetAddForm();
      setShowAddForm(false);
    } catch (err) {
      console.error('Add track failed', err);
      setAddError(String(err?.message || err || 'Failed to add track'));
    }
  };

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl sm:rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-600/25 via-white/5 to-cyan-500/20 p-4 sm:p-6 md:p-8 shadow-[0_0_60px_rgba(34,211,238,0.16)] backdrop-blur-xl">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 sm:text-sm sm:tracking-[0.45em]">MUSIC PLAYLIST MANAGER</p>
            <p className="mt-1 text-xs text-slate-400">Built by Himanshu Kumar</p>
            <h2 className="mt-2 text-xl font-semibold text-white sm:mt-3 sm:text-2xl md:text-3xl lg:text-4xl">Create, organize, and enjoy your music in one beautiful place.</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:mt-4">Discover your favorite tracks, build custom playlists, manage your music library, and enjoy a smooth listening experience with an elegant, responsive interface.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">Live 3D visualizer</span>
              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-sm text-fuchsia-200">Reactive player controls</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-slate-200">Searchable soundtrack</span>
            </div>
          </div>
          <div className="space-y-4">
            <Visualizer3D currentSong={currentSong} />
            <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 shadow-lg shadow-cyan-500/10">
              <p className="text-sm text-slate-400">Now playing</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{currentSong?.title}</p>
                  <p className="text-sm text-slate-400">{currentSong?.artist}</p>
                </div>
                <button className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white" onClick={() => playSong(currentSong?.id)}>
                  <span className="inline-flex items-center gap-2"><FaPlay /> Play</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {showAddForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">Add your music</h3>
                <p className="text-sm text-slate-400">Choose a song file from your computer and save it to your library.</p>
              </div>
              <button type="button" onClick={() => { setShowAddForm(false); resetAddForm(); }} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10">
                Close
              </button>
            </div>
            {addError ? (
              <div className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{addError}</div>
            ) : null}
            <form onSubmit={handleAddSong} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  Title
                  <input
                    value={newSongData.title}
                    onChange={(event) => setNewSongData((prev) => ({ ...prev, title: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Song title"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  Artist
                  <input
                    value={newSongData.artist}
                    onChange={(event) => setNewSongData((prev) => ({ ...prev, artist: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Artist name"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  Genre
                  <input
                    value={newSongData.genre}
                    onChange={(event) => setNewSongData((prev) => ({ ...prev, genre: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Bhojpuri, Bollywood"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  Song file
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(event) => setNewSongData((prev) => ({ ...prev, audioFile: event.target.files?.[0] ?? null, audio: '' }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500/15 file:px-3 file:py-2 file:text-sm file:text-cyan-200"
                    required={!newSongData.audio.trim()}
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  Cover image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setNewSongData((prev) => ({ ...prev, coverFile: event.target.files?.[0] ?? null }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500/15 file:px-3 file:py-2 file:text-sm file:text-cyan-200"
                  />
                </label>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <label className="block">Or paste an audio URL</label>
                <input
                  value={newSongData.audio}
                  onChange={(event) => setNewSongData((prev) => ({ ...prev, audio: event.target.value, audioFile: null }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="https://example.com/song.mp3"
                />
                <p className="text-xs text-slate-500">If you choose a local file, the file picker will be used. Otherwise paste a web audio URL.</p>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <label className="block">Genre</label>
                <input
                  value={newSongData.genre}
                  onChange={(event) => setNewSongData((prev) => ({ ...prev, genre: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Bhojpuri, Bollywood"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                  Add track
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); resetAddForm(); }} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}

      <section className="rounded-2xl sm:rounded-[2rem] border border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold">Song Library</h3>
            <p className="text-sm text-slate-400">Search your tracks and build a cinematic mix in seconds.</p>
          </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex w-full max-w-sm items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-300 shadow-inner shadow-black/30">
              <FaSearch className="text-cyan-300" />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by title or artist" className="w-full bg-transparent outline-none" />
            </label>
            <button type="button" onClick={() => setShowAddForm(true)} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/15 hover:text-white">
              Add your music
            </button>
          </div>
        </div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button onClick={() => { setGenreFilter(''); setSearchQuery(''); }} className={`rounded-full px-3 py-1 text-sm ${!genreFilter ? 'bg-cyan-500/15 text-cyan-200' : 'bg-white/5 text-slate-300'} border border-white/10`}>All</button>
            {genres.map((g) => (
              <button key={g} onClick={() => { setGenreFilter(g); setSearchQuery(''); }} className={`rounded-full px-3 py-1 text-sm ${genreFilter === g ? 'bg-cyan-500/15 text-cyan-200' : 'bg-white/5 text-slate-300'} border border-white/10`}>{capitalize(g)}</button>
            ))}
          </div>
        {showAddForm ? (
          <form onSubmit={handleAddSong} className="mt-6 rounded-[1.5rem] border border-cyan-500/10 bg-cyan-500/5 p-6 shadow-[0_20px_60px_rgba(34,211,238,0.15)]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                Title
                <input
                  value={newSongData.title}
                  onChange={(event) => setNewSongData((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Song title"
                  required
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Artist
                <input
                  value={newSongData.artist}
                  onChange={(event) => setNewSongData((prev) => ({ ...prev, artist: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Artist name"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                Audio URL
                <input
                  value={newSongData.audio}
                  onChange={(event) => setNewSongData((prev) => ({ ...prev, audio: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="/music/your-song.mp3"
                  required
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                Cover URL
                <input
                  value={newSongData.cover}
                  onChange={(event) => setNewSongData((prev) => ({ ...prev, cover: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="/images/your-cover.jpg"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                Genre
                <input
                  value={newSongData.genre}
                  onChange={(event) => setNewSongData((prev) => ({ ...prev, genre: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Bhojpuri, Bollywood"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                Add song
              </button>
              <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {visibleSongs.map((song, index) => (
            <motion.article key={song.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30 shadow-[0_20px_50px_rgba(15,23,42,0.35)] transition-transform duration-200 hover:-translate-y-1">
              <div className="relative overflow-hidden">
                <img src={song.cover} alt={song.title} className="h-32 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-40 md:h-44" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white">{song.title}</h4>
                    <p className="text-sm text-slate-400">{song.artist}</p>
                  </div>
                  <button className={`rounded-full p-2 transition ${favoritesIds.includes(song.id) ? 'text-pink-400' : 'text-slate-400 hover:text-pink-400'}`} onClick={() => toggleFavorite(song.id)}>
                    <FaHeart />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button className="flex-1 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 px-3 py-2 text-sm font-medium text-white transition hover:brightness-110" onClick={() => playSong(song.id)}>
                    <span className="inline-flex items-center justify-center gap-2"><FaPlay /> Play</span>
                  </button>
                  <button className={`rounded-full border p-2 transition ${playlistIds.includes(song.id) ? 'border-cyan-400/60 bg-cyan-400/20 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300'}`} onClick={() => addToPlaylist(song.id)}>
                    <FaPlus />
                  </button>
                  {typeof song.id === 'string' && song.id.startsWith('user-song-') ? (
                    <button title="Remove song" onClick={() => removeUserSong(song.id)} className="ml-2 rounded-full border p-2 text-rose-400 hover:bg-rose-500/10">✕</button>
                  ) : null}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
        {visibleSongs.length === 0 && (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-8 text-center text-slate-400">
            No tracks match your search yet. Try a broader query or clear the filter.
          </div>
        )}
      </section>
    </div>
  );
}
