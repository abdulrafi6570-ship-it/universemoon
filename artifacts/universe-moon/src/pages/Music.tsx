import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Plus, Trash2, Play, Pause, Music as MusicIcon, Upload, ExternalLink, Volume2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMusicStore } from '@/hooks/use-music';

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

export default function MusicPage() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const { currentSong, isPlaying, play, stop } = useMusicStore();

  const [openAdd, setOpenAdd] = useState(false);
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
        fd.append('type', 'audio');
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
    <div className="space-y-6 animate-in fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold">🎵 Music Player</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{songs.length} lagu tersedia</p>
        </div>
        {(isAdmin || !isGuest) && (
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors">
                <Plus className="w-4 h-4" /> Tambah Lagu
              </button>
            </DialogTrigger>
            <DialogContent className="glass border border-white/20 max-w-md">
              <DialogHeader><DialogTitle>Tambah Lagu Baru</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  placeholder="Judul lagu*" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/40" />
                <input value={form.artist} onChange={e => setForm(f => ({...f, artist: e.target.value}))}
                  placeholder="Artis / Band" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/40" />
                <select value={form.genre} onChange={e => setForm(f => ({...f, genre: e.target.value}))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/40">
                  <option value="">Pilih Genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Pilih sumber musik:</p>
                  <input value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))}
                    placeholder="🔗 YouTube URL (opsional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/40 mb-2" />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-white transition-colors p-3 border border-dashed border-white/20 rounded-xl">
                    <Upload className="w-4 h-4" />
                    {file ? file.name : 'Upload file audio (MP3/WAV)'}
                    <input type="file" accept="audio/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <button onClick={handleAdd} disabled={uploading || !form.title.trim()}
                  className="w-full py-3 bg-white text-black rounded-xl font-semibold disabled:opacity-50 hover:bg-gray-100">
                  {uploading ? 'Mengunggah...' : 'Tambahkan'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-2">
        {songs.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <MusicIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada lagu. Jadilah yang pertama menambahkan!</p>
          </div>
        )}
        {songs.map((song: any, i: number) => {
          const isActive = currentSong?.id === song.id;
          const ytId = song.url ? getYouTubeId(song.url) : null;
          return (
            <motion.div key={song.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`glass rounded-2xl p-3.5 flex items-center gap-3.5 transition-all ${isActive ? 'border border-white/30 bg-white/10' : 'border border-transparent hover:border-white/10'}`}>
              {/* Play button */}
              <button
                onClick={() => isActive ? stop() : play(song)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              >
                {isActive && isPlaying ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              {/* Thumbnail */}
              {ytId ? (
                <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={song.title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <MusicIcon className="w-4 h-4 text-white/40" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{song.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {song.artist && <span className="text-xs text-muted-foreground truncate">{song.artist}</span>}
                  {song.genre && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-muted-foreground">{song.genre}</span>}
                  {song.url && <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />}
                  {song.fileUrl && <Upload className="w-3 h-3 text-muted-foreground shrink-0" />}
                </div>
              </div>

              {isAdmin && (
                <button onClick={() => deleteMutation.mutate(song.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
