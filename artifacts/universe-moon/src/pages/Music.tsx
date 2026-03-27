import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Play, Music as MusicIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/use-sound';

export default function Music() {
  const { user, isGuest } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const { playSfx } = useSound();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', artist: '', url: '', addedBy: user?.username || '' });

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['music'],
    queryFn: async () => {
      const res = await fetch('/api/music');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newTrack) => {
      const res = await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrack)
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music'] });
      toast({ title: 'Lagu ditambahkan' });
      setShowForm(false);
      setFormData({ title: '', artist: '', url: '', addedBy: user?.username || '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/music/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music'] });
      toast({ title: 'Lagu dihapus' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/20 to-transparent p-6 rounded-3xl border border-primary/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <MusicIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold mb-1">UM Playlist</h1>
            <p className="text-sm text-primary/80">Soundtrack perjalanan kita di semesta</p>
          </div>
        </div>
        {user && !isGuest && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-primary text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-primary/80 transition-colors shadow-[0_0_15px_rgba(var(--primary),0.5)]"
          >
            <Plus className="w-4 h-4"/> Tambah Lagu
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass p-6 rounded-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Judul Lagu</label>
                  <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Artis/Penyanyi</label>
                  <input required value={formData.artist} onChange={e=>setFormData({...formData, artist: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Link (Spotify/YouTube)</label>
                  <input type="url" required value={formData.url} onChange={e=>setFormData({...formData, url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5">Batal</button>
                <button type="submit" disabled={addMutation.isPending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/80">Simpan</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Memuat playlist...</div>
        ) : (
          <div className="divide-y divide-white/5">
            {tracks.length === 0 && <div className="text-center py-10 text-muted-foreground">Playlist masih kosong.</div>}
            {tracks.map((track: any, i: number) => (
              <div key={track.id || i} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group">
                <div className="w-8 text-center text-muted-foreground font-mono text-sm group-hover:text-primary">
                  {String(i + 1).padStart(2, '0')}
                </div>
                
                <a href={track.url} target="_blank" rel="noreferrer" onClick={() => playSfx('click')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors cursor-pointer">
                  <Play className="w-4 h-4 ml-1" />
                </a>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{track.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                </div>
                
                <div className="hidden md:block text-xs text-muted-foreground px-4 border-l border-white/10">
                  Added by: {track.addedBy || 'Anon'}
                </div>
                
                {isAdmin && (
                  <button onClick={() => { if(confirm('Hapus lagu?')) deleteMutation.mutate(track.id); }} className="text-destructive/50 hover:text-destructive p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
