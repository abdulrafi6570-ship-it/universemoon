import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Trash2, Tv, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const GENRES = ['Romance', 'Drama', 'Thriller', 'Komedi', 'Slice of Life', 'Fantasi', 'Aksi', 'Misteri', 'Historical', 'School', 'Medical', 'Legal'];

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange?.(i)} className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star className={`w-4 h-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`} />
        </button>
      ))}
    </div>
  );
}

export default function Drakor() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [openAdd, setOpenAdd] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', year: '', genre: 'Romance', rating: 5, poster: '', notes: '' });

  const { data: allDrakor = [] } = useQuery({
    queryKey: ['drakor'],
    queryFn: () => fetch('/api/drakor').then(r => r.json()),
    refetchInterval: 30000,
  });

  const handleAdd = async () => {
    if (!form.title.trim()) return toast({ title: 'Judul drakor wajib diisi!', variant: 'destructive' });
    if (!user?.username) return;
    const res = await fetch('/api/drakor', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberName: user.username, drama: form }),
    });
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ['drakor'] });
      setForm({ title: '', year: '', genre: 'Romance', rating: 5, poster: '', notes: '' });
      setOpenAdd(false);
      toast({ title: 'Drakor ditambahkan!' });
    }
  };

  const handleDelete = async (memberName: string, idx: number) => {
    if (!confirm('Hapus drakor ini?')) return;
    await fetch(`/api/drakor/${memberName}/drama/${idx}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['drakor'] });
  };

  const toggleExpand = (name: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  };

  const filtered = allDrakor.map((d: any) => ({
    ...d,
    dramas: (d.dramas || []).filter((drama: any) =>
      !search || drama.title.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((d: any) => d.dramas.length > 0 || !search);

  const allDramas = allDrakor.flatMap((d: any) => (d.dramas || []).map((dr: any) => ({ ...dr, memberName: d.memberName })));
  const totalDramas = allDramas.length;
  const topRated = [...allDramas].sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold">Drakor Favorit</h2>
          <p className="text-muted-foreground text-sm mt-0.5">List drama Korea kesukaan member Universe Moon — {totalDramas} drama tercatat</p>
        </div>
        {!isGuest && (
          <button onClick={() => setOpenAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors">
            <Plus className="w-4 h-4" /> Tambah Drakor
          </button>
        )}
      </div>

      {/* Top Rated */}
      {topRated.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Top Rated
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {topRated.map((d: any, i: number) => (
              <div key={i} className="text-center p-3 bg-white/5 rounded-xl">
                {d.poster ? (
                  <img src={d.poster} alt={d.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-b from-purple-900/40 to-pink-900/30 rounded-lg mb-2 flex items-center justify-center">
                    <Tv className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <p className="text-xs font-semibold truncate">{d.title}</p>
                <p className="text-[10px] text-muted-foreground">{d.memberName}</p>
                <StarRating rating={d.rating} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari judul drakor..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
      </div>

      {/* Member Lists */}
      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Tv className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{search ? 'Drakor tidak ditemukan.' : 'Belum ada list drakor. Tambahkan favoritmu!'}</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((member: any) => {
          const dramas: any[] = member.dramas || [];
          const isExpanded = expanded.has(member.memberName);
          const isMe = user?.username === member.memberName;
          const avgRating = dramas.length ? (dramas.reduce((s: number, d: any) => s + (d.rating || 0), 0) / dramas.length).toFixed(1) : '-';

          return (
            <motion.div key={member.id || member.memberName} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass rounded-2xl overflow-hidden border border-white/10">
              <button onClick={() => toggleExpand(member.memberName)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center font-bold">
                    {member.memberName?.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{member.memberName} {isMe && <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-1">Kamu</span>}</p>
                    <p className="text-[11px] text-muted-foreground">{dramas.length} drama · Rata-rata <StarRating rating={Math.round(+avgRating)} /></p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dramas.map((drama: any, idx: number) => (
                        <div key={idx} className="flex gap-3 bg-white/5 rounded-xl p-3 group relative hover:bg-white/8 transition-colors">
                          {drama.poster ? (
                            <img src={drama.poster} alt={drama.title} className="w-12 h-16 object-cover rounded-lg shrink-0" />
                          ) : (
                            <div className="w-12 h-16 bg-gradient-to-b from-purple-900/40 to-pink-900/20 rounded-lg flex items-center justify-center shrink-0">
                              <Tv className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{drama.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {drama.year && <span className="text-[10px] text-muted-foreground">{drama.year}</span>}
                              {drama.genre && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{drama.genre}</span>}
                            </div>
                            <StarRating rating={drama.rating || 0} />
                            {drama.notes && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 italic">"{drama.notes}"</p>}
                          </div>
                          {(isMe || isAdmin) && (
                            <button onClick={() => handleDelete(member.memberName, idx)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-900/30 rounded-lg transition-opacity">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Add Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="glass border border-white/20 max-w-md">
          <DialogHeader><DialogTitle>Tambah Drakor Favorit</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Judul drama*" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                placeholder="Tahun (contoh: 2024)" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
              <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Rating</label>
              <StarRating rating={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
            </div>
            <input value={form.poster} onChange={e => setForm(f => ({ ...f, poster: e.target.value }))}
              placeholder="URL poster (opsional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Review singkat / kesan... (opsional)" rows={2} maxLength={200}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none" />
            <button onClick={handleAdd} disabled={!form.title.trim()}
              className="w-full py-3 bg-gradient-to-r from-primary to-pink-600 rounded-xl font-semibold disabled:opacity-50">
              Tambahkan
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
