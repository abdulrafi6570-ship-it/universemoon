import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Play, Pause, Music as MusicIcon, Upload, ExternalLink, Volume2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

function isYouTube(url: string) { return /youtu/i.test(url); }

function MusicPlayer({ song, onClose }: { song: any; onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytId = song.url ? getYouTubeId(song.url) : null;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  if (ytId) {
    return (
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-0 right-0 z-50 mx-4">
        <div className="glass rounded-2xl overflow-hidden border border-white/20 shadow-2xl max-w-md mx-auto">
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MusicIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold truncate">{song.title}</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            allow="autoplay; encrypted-media"
            className="w-full h-48"
            title={song.title}
          />
        </div>
      </motion.div>
    );
  }

  if (song.fileUrl) {
    return (
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-0 right-0 z-50 mx-4">
        <div className="glass rounded-2xl p-4 border border-white/20 shadow-2xl max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MusicIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold truncate max-w-[200px]">{song.title}</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <audio ref={audioRef} src={song.fileUrl} onEnded={() => setIsPlaying(false)} preload="metadata" className="w-full h-8" controls />
            </div>
          </div>
          {song.artist && <p className="text-xs text-muted-foreground mt-2">{song.artist}</p>}
        </div>
      </motion.div>
    );
  }

  return null;
}

export default function MusicPage() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [openAdd, setOpenAdd] = useState(false);
  const [activePlayer, setActivePlayer] = useState<any>(null);
  const [form, setForm] = useState({ title: '', artist: '', url: '', genre: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: songs = [] } = useQuery({
    queryKey: ['music'],
    queryFn: () => fetch('/api/music').then(r => r.json()),
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/music/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['music'] }),
  });

  const handleAdd = async () => {
    if (!form.title.trim()) return toast({ title: 'Judul wajib diisi!', variant: 'destructive' });
    setUploading(true);
    try {
      let fileUrl = '';
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'music');
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (upRes.ok) { const upData = await upRes.json(); fileUrl = upData.url; }
      }
      await fetch('/api/music', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fileUrl, addedBy: user?.username }),
      });
      qc.invalidateQueries({ queryKey: ['music'] });
      setForm({ title: '', artist: '', url: '', genre: '' });
      setFile(null); setOpenAdd(false);
    } finally { setUploading(false); }
  };

  const GENRES = ['Pop', 'Rock', 'R&B', 'K-Pop', 'EDM', 'Indie', 'Dangdut', 'Hip-Hop', 'Lainnya'];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold">🎵 Music Player</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{songs.length} lagu tersedia</p>
        </div>
        {(isAdmin || !isGuest) && (
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors">
                <Plus className="w-4 h-4" /> Tambah Lagu
              </button>
            </DialogTrigger>
            <DialogContent className="glass border border-white/20 max-w-md">
              <DialogHeader><DialogTitle>Tambah Lagu Baru</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  placeholder="Judul lagu*" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <input value={form.artist} onChange={e => setForm(f => ({...f, artist: e.target.value}))}
                  placeholder="Artis / Band" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <select value={form.genre} onChange={e => setForm(f => ({...f, genre: e.target.value}))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary">
                  <option value="">Pilih Genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Pilih sumber musik:</p>
                  <input value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))}
                    placeholder="🔗 YouTube URL (opsional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary mb-2" />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-white transition-colors p-3 border border-dashed border-white/20 rounded-xl">
                    <Upload className="w-4 h-4" />
                    {file ? file.name : 'Upload file audio (MP3/WAV)'}
                    <input type="file" accept="audio/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <button onClick={handleAdd} disabled={uploading || !form.title.trim()}
                  className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 rounded-xl font-semibold disabled:opacity-50">
                  {uploading ? 'Mengunggah...' : 'Tambahkan'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {songs.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <MusicIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada lagu. Jadilah yang pertama menambahkan!</p>
          </div>
        )}
        {songs.map((song: any, i: number) => {
          const isPlaying = activePlayer?.id === song.id;
          const ytId = song.url ? getYouTubeId(song.url) : null;
          return (
            <motion.div key={song.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass rounded-2xl p-4 flex items-center gap-4 transition-all ${isPlaying ? 'border border-primary/40 bg-primary/5' : 'border border-transparent hover:border-white/10'}`}>
              <button onClick={() => setActivePlayer(isPlaying ? null : song)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${isPlaying ? 'bg-primary' : 'bg-white/10 hover:bg-white/20'}`}>
                {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              {ytId ? (
                <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={song.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center shrink-0">
                  <MusicIcon className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{song.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {song.artist && <span className="text-xs text-muted-foreground truncate">{song.artist}</span>}
                  {song.genre && <span className="text-[10px] text-muted-foreground bg-white/10 px-2 py-0.5 rounded-full">{song.genre}</span>}
                  {song.url && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                  {song.fileUrl && <Upload className="w-3 h-3 text-muted-foreground" />}
                </div>
                {song.addedBy && <p className="text-[10px] text-muted-foreground mt-0.5">by {song.addedBy}</p>}
              </div>

              {isAdmin && (
                <button onClick={() => deleteMutation.mutate(song.id)} className="p-2 text-destructive hover:bg-red-900/20 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {activePlayer && <MusicPlayer song={activePlayer} onClose={() => setActivePlayer(null)} />}
      </AnimatePresence>
    </div>
  );
}
