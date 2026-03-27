import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, UserMinus, Trash2, RotateCcw, Users, UserCheck,
  UserX, Plus, Camera, Settings, AlertTriangle, X, Flame
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

export default function Admin() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [kickReasonMap, setKickReasonMap] = useState<Record<number, string>>({});
  const [showKickForm, setShowKickForm] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({ name: '', role: 'Member', joinDate: '', specialty: '' });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Shield className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground">Akses ditolak. Hanya admin yang bisa masuk ke halaman ini.</p>
        <button onClick={() => setLocation('/')} className="px-6 py-2 bg-white/10 rounded-xl text-sm hover:bg-white/20">
          Kembali ke Home
        </button>
      </div>
    );
  }

  const { data: allMembers = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => fetch('/api/members').then(r => r.json()),
    refetchInterval: 15000,
  });

  const activeMembers = allMembers.filter((m: any) => m.isActive);
  const exMembers = allMembers.filter((m: any) => !m.isActive);

  const kickMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      fetch(`/api/members/${id}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      setShowKickForm(null);
      toast({ title: 'Member berhasil di-kick dan dipindahkan ke Ex-Members.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast({ title: 'Member dihapus permanen.' });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true, kickReason: null, kickDate: null }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast({ title: 'Member dipulihkan kembali!' });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      setShowAddForm(false);
      setAddForm({ name: '', role: 'Member', joinDate: '', specialty: '' });
      toast({ title: 'Member baru ditambahkan!' });
    },
  });

  const handleReset = async () => {
    if (resetConfirmText !== 'RESET') return;
    setResetting(true);
    try {
      const res = await fetch('/api/events/reset-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RESET', adminUsername: user!.username }),
      });
      if (res.ok) {
        toast({ title: '🔥 Semua data komunitas telah direset dari awal.' });
        setShowResetModal(false);
        setResetStep(1);
        setResetConfirmText('');
        qc.invalidateQueries();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Gagal reset', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Koneksi gagal', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  const uploadAvatar = async (memberId: number, file: File) => {
    setUploading(memberId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'avatar');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const { url } = await res.json();
        await fetch(`/api/members/${memberId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: url }),
        });
        qc.invalidateQueries({ queryKey: ['members'] });
        toast({ title: 'Foto diperbarui!' });
      }
    } finally {
      setUploading(null);
    }
  };

  const ROLES = ['Member', 'Aktif', 'Special', 'Admin', 'Wakil Ketua', 'Ketua'];
  const ROLE_BADGE: Record<string, string> = {
    Ketua: 'bg-yellow-500/20 text-yellow-300',
    'Wakil Ketua': 'bg-blue-500/20 text-blue-300',
    Admin: 'bg-purple-500/20 text-purple-300',
    Special: 'bg-pink-500/20 text-pink-300',
    Aktif: 'bg-green-500/20 text-green-300',
    Member: 'bg-white/10 text-white/60',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold">Panel Admin</h1>
          <p className="text-muted-foreground text-sm">Kelola member Universe Moon dari sini.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Member', value: activeMembers.length, icon: Users, color: 'text-green-400' },
          { label: 'Ex-Member', value: exMembers.length, icon: UserMinus, color: 'text-red-400' },
          { label: 'Total Seluruhnya', value: allMembers.length, icon: UserCheck, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <s.icon className={`w-6 h-6 mx-auto mb-1 ${s.color}`} />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active Members */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-400" />
            <h2 className="font-semibold">Member Aktif ({activeMembers.length})</h2>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-white/10">
              <div className="p-5 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Nama *</label>
                  <input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nama member..." className="w-full um-input" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Role</label>
                  <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))} className="w-full um-input">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Tanggal Bergabung</label>
                  <input type="date" value={addForm.joinDate} onChange={e => setAddForm(p => ({ ...p, joinDate: e.target.value }))} className="w-full um-input" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Keahlian / Spesialisasi</label>
                  <input value={addForm.specialty} onChange={e => setAddForm(p => ({ ...p, specialty: e.target.value }))}
                    placeholder="Misalnya: Desain, Vokal, dll..." className="w-full um-input" />
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-white">Batal</button>
                  <button
                    disabled={!addForm.name.trim() || createMutation.isPending}
                    onClick={() => createMutation.mutate(addForm)}
                    className="px-5 py-2 bg-white text-black rounded-xl text-sm font-semibold disabled:opacity-50"
                  >Simpan</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="divide-y divide-white/5">
          {activeMembers.map((m: any) => (
            <div key={m.id} className="p-4 flex items-center gap-3">
              <div className="relative shrink-0 group">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                    {m.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => { const el = document.getElementById(`avatar-${m.id}`); el?.click(); }}
                  className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input id={`avatar-${m.id}`} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadAvatar(m.id, e.target.files[0])} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{m.name}</span>
                  {m.nickname && m.nickname !== m.name && (
                    <span className="text-xs text-muted-foreground">({m.nickname})</span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${ROLE_BADGE[m.role] || ROLE_BADGE['Member']}`}>
                    {m.role}
                  </span>
                </div>
                {m.joinDate && <div className="text-[10px] text-muted-foreground mt-0.5">Bergabung: {m.joinDate}</div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowKickForm(showKickForm === m.id ? null : m.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 text-orange-300 rounded-xl text-xs hover:bg-orange-500/30 transition-colors"
                >
                  <UserX className="w-3.5 h-3.5" /> Kick
                </button>
                <button
                  onClick={() => { if (confirm(`Hapus ${m.name} permanen?`)) deleteMutation.mutate(m.id); }}
                  className="p-1.5 text-destructive hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {activeMembers.length === 0 && (
            <div className="p-10 text-center text-muted-foreground text-sm">Belum ada member aktif.</div>
          )}
        </div>
      </div>

      {/* Kick reason forms */}
      <AnimatePresence>
        {showKickForm !== null && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass rounded-2xl p-5 border border-orange-500/20">
            <p className="text-sm font-semibold mb-3 text-orange-300">
              Alasan kick: {allMembers.find((m: any) => m.id === showKickForm)?.name}
            </p>
            <textarea
              value={kickReasonMap[showKickForm!] || ''}
              onChange={e => setKickReasonMap(p => ({ ...p, [showKickForm!]: e.target.value }))}
              placeholder="Tulis alasan... (opsional)"
              rows={2}
              className="w-full um-input resize-none mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowKickForm(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-white">Batal</button>
              <button
                onClick={() => kickMutation.mutate({ id: showKickForm!, reason: kickReasonMap[showKickForm!] || 'Kicked by admin' })}
                disabled={kickMutation.isPending}
                className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >Konfirmasi Kick</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ex-Members */}
      {exMembers.length > 0 && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="flex items-center gap-2 p-5 border-b border-white/10">
            <UserMinus className="w-5 h-5 text-red-400" />
            <h2 className="font-semibold">Ex-Members ({exMembers.length})</h2>
          </div>
          <div className="divide-y divide-white/5">
            {exMembers.map((m: any) => (
              <div key={m.id} className="p-4 flex items-center gap-3">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.name} className="w-10 h-10 rounded-full object-cover opacity-50" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-sm text-white/40">
                    {m.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white/60">{m.name}</div>
                  {m.kickReason && (
                    <div className="text-[10px] text-red-400/80 mt-0.5">Alasan: {m.kickReason}</div>
                  )}
                  {m.kickDate && (
                    <div className="text-[10px] text-muted-foreground">Kick: {m.kickDate}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => restoreMutation.mutate(m.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-300 rounded-xl text-xs hover:bg-green-500/30 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Pulihkan
                  </button>
                  <button
                    onClick={() => { if (confirm(`Hapus ${m.name} permanen?`)) deleteMutation.mutate(m.id); }}
                    className="p-1.5 text-destructive hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Zona Berbahaya ─────────────────────────────────────────── */}
      <div className="border border-red-500/30 rounded-3xl overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b border-red-500/20 bg-red-500/5">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="font-semibold text-red-300">Zona Berbahaya</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-sm text-red-300">Reset Semua Data Komunitas</p>
              <p className="text-xs text-muted-foreground mt-1">
                Menghapus seluruh chat, foto, memori, NGL, keluarga APIPI, game, poll, diary, dan semua konten lainnya.
                Akun login & daftar member <span className="text-white/70 font-medium">tetap aman</span>.
              </p>
            </div>
            <button
              onClick={() => { setShowResetModal(true); setResetStep(1); setResetConfirmText(''); }}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/40 rounded-xl text-sm font-semibold hover:bg-red-500/30 transition-all"
            >
              <Flame className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* ─── Modal Konfirmasi Reset ──────────────────────────────────── */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) { setShowResetModal(false); setResetStep(1); setResetConfirmText(''); } }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md glass rounded-3xl border border-red-500/30 overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-red-500/20 bg-red-500/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="font-bold text-red-300">Konfirmasi Reset Data</span>
                </div>
                <button onClick={() => { setShowResetModal(false); setResetStep(1); setResetConfirmText(''); }}
                  className="p-1.5 text-muted-foreground hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {resetStep === 1 ? (
                  <>
                    {/* Step 1: Tampilkan apa yang akan dihapus */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-red-300 flex items-center gap-2">
                        <AlertTriangle size={14} /> Ini akan MENGHAPUS PERMANEN:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        {[
                          '💬 Semua pesan chat & DM',
                          '📸 Semua foto di galeri',
                          '📖 Semua memori & milestones',
                          '🎵 Semua musik & playlist',
                          '👻 Semua pesan NGL',
                          '👨‍👩‍👧‍👦 Semua keluarga APIPI',
                          '🎮 Semua data game & leaderboard',
                          '📊 Semua poll & voting',
                          '📔 Semua diary & fanfic',
                          '😊 Semua mood, meme, quote, shoutout',
                          '🌟 Semua XP & streak user direset ke 0',
                        ].map(item => (
                          <li key={item} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <p className="text-xs text-green-400">
                        ✅ <strong>Aman:</strong> Akun login, daftar member, rules, links, birthdays, & drakor tidak ikut terhapus.
                      </p>
                    </div>
                    <p className="text-sm text-center text-muted-foreground">Apakah kamu yakin ingin melanjutkan?</p>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowResetModal(false); setResetStep(1); }}
                        className="flex-1 py-2.5 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition-colors">
                        Batal
                      </button>
                      <button onClick={() => setResetStep(2)}
                        className="flex-1 py-2.5 bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl text-sm font-semibold hover:bg-red-500/40 transition-colors">
                        Ya, Lanjut →
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Step 2: Ketik RESET untuk konfirmasi */}
                    <div className="text-center space-y-2">
                      <div className="text-4xl">🔥</div>
                      <p className="font-bold text-red-300">Konfirmasi Akhir</p>
                      <p className="text-sm text-muted-foreground">
                        Ketik <span className="font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">RESET</span> untuk melanjutkan
                      </p>
                    </div>
                    <input
                      value={resetConfirmText}
                      onChange={e => setResetConfirmText(e.target.value)}
                      placeholder="Ketik RESET di sini..."
                      className="w-full text-center font-mono text-lg glass rounded-xl px-4 py-3 border border-red-500/30 focus:outline-none focus:border-red-500/60 tracking-widest"
                    />
                    <div className="flex gap-3">
                      <button onClick={() => setResetStep(1)}
                        className="flex-1 py-2.5 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition-colors">
                        ← Kembali
                      </button>
                      <button
                        onClick={handleReset}
                        disabled={resetConfirmText !== 'RESET' || resetting}
                        className="flex-1 py-2.5 bg-red-600/60 text-white border border-red-500/60 rounded-xl text-sm font-bold hover:bg-red-600/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {resetting ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mereset...</>
                        ) : (
                          <><Flame size={14} /> Reset Sekarang</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
