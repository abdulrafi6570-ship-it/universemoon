import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Check, Star, Film, ChevronRight,
  Eye, EyeOff, Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Drama {
  title: string;
  year: string;
  genre: string;
  rating: number;
  notes: string;
  watched: boolean;
  addedAt: string;
}

interface DrakorEntry {
  id: number;
  memberName: string;
  dramas: Drama[];
  updatedAt: string;
}

interface Member {
  id: number;
  name: string;
  avatarUrl?: string;
}

const GENRES = ['Romance', 'Thriller', 'Fantasy', 'Historical', 'Comedy', 'Action', 'Mystery', 'Drama', 'Horror', 'Slice of Life'];

const MEMBER_COLORS = [
  'from-purple-500/20 to-pink-500/20',
  'from-blue-500/20 to-cyan-500/20',
  'from-green-500/20 to-teal-500/20',
  'from-orange-500/20 to-yellow-500/20',
  'from-red-500/20 to-pink-500/20',
  'from-indigo-500/20 to-violet-500/20',
  'from-rose-500/20 to-fuchsia-500/20',
  'from-sky-500/20 to-blue-500/20',
];

function MemberAvatar({ name, src, size = 'w-12 h-12' }: { name: string; src?: string; size?: string }) {
  const colors = ['bg-purple-500/50', 'bg-blue-500/50', 'bg-green-500/50', 'bg-pink-500/50', 'bg-orange-500/50', 'bg-cyan-500/50'];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (src) return <img src={src} className={`${size} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${size} rounded-full ${color} flex items-center justify-center font-bold text-sm shrink-0`}>
      {name.substring(0, 2).toUpperCase()}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange?.(s)} disabled={!onChange}
          className={`${s <= value ? 'text-yellow-400' : 'text-white/20'} transition-colors ${onChange ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}>
          <Star className="w-3.5 h-3.5 fill-current" />
        </button>
      ))}
    </div>
  );
}

export default function DrakorPage() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | 'watched' | 'unwatched'>('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', year: '', genre: '', rating: 0, notes: '', watched: false });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: () => fetch('/api/members').then(r => r.json()),
  });

  const { data: drakorList = [] } = useQuery<DrakorEntry[]>({
    queryKey: ['drakor'],
    queryFn: () => fetch('/api/drakor').then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: selectedEntry } = useQuery<DrakorEntry | null>({
    queryKey: ['drakor', selectedMember],
    queryFn: () =>
      selectedMember
        ? fetch(`/api/drakor/${encodeURIComponent(selectedMember)}`).then(r => r.json())
        : null,
    enabled: !!selectedMember,
    refetchInterval: selectedMember ? 5000 : false,
  });

  const addMutation = useMutation({
    mutationFn: (drama: typeof form) =>
      fetch('/api/drakor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberName: user?.username, drama }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drakor'] });
      qc.invalidateQueries({ queryKey: ['drakor', selectedMember] });
      setForm({ title: '', year: '', genre: '', rating: 0, notes: '', watched: false });
      setShowAdd(false);
      toast({ title: '✅ Drama ditambahkan!' });
    },
  });

  const toggleWatched = useMutation({
    mutationFn: ({ memberName, idx }: { memberName: string; idx: number }) =>
      fetch(`/api/drakor/${encodeURIComponent(memberName)}/drama/${idx}/watched`, { method: 'PATCH' }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drakor'] });
      qc.invalidateQueries({ queryKey: ['drakor', selectedMember] });
    },
  });

  const deleteDrama = useMutation({
    mutationFn: ({ memberName, idx }: { memberName: string; idx: number }) =>
      fetch(`/api/drakor/${encodeURIComponent(memberName)}/drama/${idx}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drakor'] });
      qc.invalidateQueries({ queryKey: ['drakor', selectedMember] });
      toast({ title: '🗑️ Drama dihapus' });
    },
  });

  const getDrakorForMember = useCallback(
    (name: string) => drakorList.find(d => d.memberName === name),
    [drakorList]
  );

  const dramas = selectedEntry?.dramas ?? [];
  const filteredDramas = dramas.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true : filter === 'watched' ? d.watched : !d.watched;
    return matchSearch && matchFilter;
  });

  const isOwnList = selectedMember === user?.username;
  const canEdit = isOwnList && !isGuest;

  const openPanel = (name: string) => {
    setSelectedMember(name);
    setShowAdd(false);
    setSearch('');
    setFilter('all');
  };

  const closePanel = () => {
    setSelectedMember(null);
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold">🎬 Drakor Favs</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Korean Drama favorit setiap member — klik kartu untuk lihat list
        </p>
      </div>

      {/* Member cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {members.map((member, i) => {
          const entry = getDrakorForMember(member.name);
          const total = entry?.dramas?.length ?? 0;
          const watched = entry?.dramas?.filter(d => d.watched)?.length ?? 0;
          const colorClass = MEMBER_COLORS[i % MEMBER_COLORS.length];
          const pct = total > 0 ? (watched / total) * 100 : 0;

          return (
            <motion.button
              key={member.id}
              onClick={() => openPanel(member.name)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`glass rounded-2xl p-4 text-left border border-white/10 hover:border-white/30 transition-all bg-gradient-to-br ${colorClass} relative group cursor-pointer`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                {/* Avatar */}
                <MemberAvatar name={member.name} src={member.avatarUrl} />

                {/* Name + stats */}
                <div className="w-full">
                  <p className="font-semibold text-sm truncate">{member.name}</p>

                  {total > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground mt-0.5">{total} drama</p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-green-400" />
                        <span className="text-[10px] text-green-400">{watched} ditonton</span>
                      </div>
                      {/* Watch progress bar */}
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                        <motion.div
                          className="h-full bg-gradient-to-r from-green-400 to-teal-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.06 + 0.3, duration: 0.6 }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-1 italic">Belum ada drama</p>
                  )}
                </div>
              </div>

              {/* Arrow hint */}
              <ChevronRight className="absolute top-3 right-3 w-3.5 h-3.5 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          );
        })}
      </div>

      {/* ===== Side panel ===== */}
      <AnimatePresence>
        {selectedMember && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={closePanel}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col"
              style={{ background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(255,255,255,0.12)' }}
            >
              {/* Panel header */}
              <div className="p-5 border-b border-white/10 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MemberAvatar name={selectedMember} size="w-10 h-10" />
                    <div>
                      <h3 className="font-bold">{selectedMember}</h3>
                      <p className="text-xs text-muted-foreground">
                        {dramas.length} drama · {dramas.filter(d => d.watched).length} ditonton
                      </p>
                    </div>
                  </div>
                  <button onClick={closePanel} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search + filter bar */}
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Cari drama..."
                      className="bg-transparent text-sm focus:outline-none w-full"
                    />
                  </div>
                  {/* Filter pills */}
                  <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
                    {([
                      { key: 'all', label: 'Semua' },
                      { key: 'watched', label: <Eye className="w-3.5 h-3.5" /> },
                      { key: 'unwatched', label: <EyeOff className="w-3.5 h-3.5" /> },
                    ] as { key: 'all' | 'watched' | 'unwatched'; label: any }[]).map(f => (
                      <button key={f.key} onClick={() => setFilter(f.key)}
                        title={f.key === 'watched' ? 'Sudah ditonton' : f.key === 'unwatched' ? 'Belum ditonton' : 'Semua'}
                        className={`px-2.5 py-2 text-xs flex items-center justify-center transition-colors ${
                          filter === f.key ? 'bg-white/20 text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                        }`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add drama inline form */}
              <AnimatePresence>
                {showAdd && canEdit && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-white/10 overflow-hidden shrink-0"
                  >
                    <div className="p-4 space-y-3">
                      <p className="text-sm font-semibold text-white/80">➕ Tambah Drama Baru</p>

                      <input
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Judul drama *"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={form.year}
                          onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                          placeholder="Tahun"
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                        />
                        <select
                          value={form.genre}
                          onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                        >
                          <option value="">Genre</option>
                          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Rating</p>
                          <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <span className="text-xs text-muted-foreground">Sudah ditonton</span>
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, watched: !f.watched }))}
                            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${form.watched ? 'bg-green-500' : 'bg-white/20'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.watched ? 'left-[22px]' : 'left-0.5'}`} />
                          </button>
                        </label>
                      </div>

                      <input
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Catatan singkat (opsional)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => addMutation.mutate(form)}
                          disabled={!form.title.trim() || addMutation.isPending}
                          className="flex-1 py-2.5 bg-white text-black text-sm font-bold rounded-xl disabled:opacity-40 hover:bg-gray-100 transition-colors"
                        >
                          {addMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                          onClick={() => setShowAdd(false)}
                          className="px-4 py-2.5 bg-white/10 rounded-xl text-sm transition-colors hover:bg-white/15"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Drama list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredDramas.length === 0 && (
                  <div className="text-center py-14">
                    <Film className="w-12 h-12 text-white/15 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {dramas.length === 0 ? 'Belum ada drama di sini' : 'Tidak ada hasil untuk filter ini'}
                    </p>
                    {dramas.length === 0 && canEdit && (
                      <button onClick={() => setShowAdd(true)}
                        className="mt-3 text-primary text-sm hover:underline">
                        + Tambah drama pertama
                      </button>
                    )}
                  </div>
                )}

                {filteredDramas.map((drama) => {
                  const realIdx = dramas.indexOf(drama);
                  return (
                    <motion.div
                      key={`${drama.title}-${drama.addedAt}`}
                      layout
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-2xl p-3.5 border transition-all ${
                        drama.watched
                          ? 'border-green-500/20 bg-green-500/5'
                          : 'border-white/8 bg-white/3'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Watched circle button */}
                        <button
                          onClick={() => canEdit && toggleWatched.mutate({ memberName: selectedMember, idx: realIdx })}
                          disabled={!canEdit}
                          title={canEdit ? (drama.watched ? 'Tandai belum ditonton' : 'Tandai sudah ditonton') : ''}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            drama.watched
                              ? 'bg-green-500 border-green-500 text-black'
                              : `border-white/30 ${canEdit ? 'hover:border-green-400/60 cursor-pointer' : 'cursor-default'}`
                          }`}
                        >
                          {drama.watched && <Check className="w-2.5 h-2.5" />}
                        </button>

                        {/* Drama info */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm leading-tight ${drama.watched ? 'text-white/50 line-through' : 'text-white'}`}>
                            {drama.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                            {drama.year && (
                              <span className="text-[10px] text-white/40">{drama.year}</span>
                            )}
                            {drama.genre && (
                              <span className="text-[10px] bg-white/8 px-2 py-0.5 rounded-full text-white/50">{drama.genre}</span>
                            )}
                            {drama.rating > 0 && <StarRating value={drama.rating} />}
                          </div>
                          {drama.notes && (
                            <p className="text-xs text-white/40 mt-1.5 italic leading-relaxed">"{drama.notes}"</p>
                          )}
                          {drama.watched && (
                            <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1 font-medium">
                              <Check className="w-2.5 h-2.5" /> Sudah ditonton
                            </p>
                          )}
                        </div>

                        {/* Delete (only own list) */}
                        {canEdit && (
                          <button
                            onClick={() => deleteDrama.mutate({ memberName: selectedMember, idx: realIdx })}
                            className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer: add button */}
              {canEdit && (
                <div className="p-4 border-t border-white/10 shrink-0">
                  <button
                    onClick={() => setShowAdd(v => !v)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white/8 hover:bg-white/14 border border-white/12 hover:border-white/25 rounded-2xl text-sm font-semibold transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Drama
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
