import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { UserMinus, Trash2, Plus, Star, Shield, Camera, Calendar, Upload, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const ROLE_ICONS: Record<string, string> = { 'Ketua': '👑', 'Wakil Ketua': '⭐', 'Admin': '🛡️', 'Member': '👤', 'Special': '✨', 'Aktif': '🔥' };

export default function Members() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const fileRef = useRef<HTMLInputElement>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', role: 'Member', joinDate: '', specialty: '' });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => fetch('/api/members').then(r => r.json()),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setOpenAdd(false); setForm({ name: '', role: 'Member', joinDate: '', specialty: '' }); toast({ title: 'Member ditambahkan!' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); toast({ title: 'Member dihapus.' }); },
  });

  const kickMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/members/${id}/kick`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); toast({ title: 'Member di-kick.' }); },
  });

  const uploadAvatar = async (memberId: number, file: File) => {
    setUploading(memberId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'avatar');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const { url } = await res.json();
        await fetch(`/api/members/${memberId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: url }) });
        qc.invalidateQueries({ queryKey: ['members'] });
        toast({ title: 'Foto profil diperbarui!' });
      }
    } finally { setUploading(null); }
  };

  const ROLES = ['Member', 'Aktif', 'Special', 'Admin', 'Wakil Ketua', 'Ketua'];

  const grouped: Record<string, any[]> = {};
  for (const m of members) {
    const role = m.role || 'Member';
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(m);
  }
  const ORDER = ['Ketua', 'Wakil Ketua', 'Admin', 'Special', 'Aktif', 'Member'];
  const sortedGroups = ORDER.filter(r => grouped[r]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold">👥 Member Universe Moon</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{members.length} anggota terdaftar</p>
        </div>
        {isAdmin && (
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors">
                <Plus className="w-4 h-4" /> Tambah Member
              </button>
            </DialogTrigger>
            <DialogContent className="glass border border-white/20 max-w-md">
              <DialogHeader><DialogTitle>Tambah Member Baru</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="Nama*" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary">
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_ICONS[r] || '•'} {r}</option>)}
                </select>
                <input value={form.specialty} onChange={e => setForm(f => ({...f, specialty: e.target.value}))}
                  placeholder="Spesialitas / jabatan (opsional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tanggal Bergabung</label>
                  <input type="date" value={form.joinDate} onChange={e => setForm(f => ({...f, joinDate: e.target.value}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
                <button onClick={() => createMutation.mutate(form)} disabled={!form.name.trim()}
                  className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 rounded-xl font-semibold disabled:opacity-50">Tambahkan</button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sortedGroups.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          Belum ada member terdaftar.
        </div>
      )}

      {sortedGroups.map(role => (
        <div key={role}>
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <span>{ROLE_ICONS[role] || '•'}</span> {role}
            <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs normal-case">{grouped[role].length}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {grouped[role].map((member: any, i: number) => (
              <motion.div key={member.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass rounded-2xl p-4 text-center relative group hover:border-white/20 border border-transparent transition-all">
                {/* Avatar */}
                <div className="relative mx-auto mb-3 w-16 h-16">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-xl font-bold">
                      {member.name.substring(0,1).toUpperCase()}
                    </div>
                  )}
                  {isAdmin && (
                    <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploading === member.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadAvatar(member.id, file);
                      }} />
                    </label>
                  )}
                </div>

                <p className="font-semibold text-sm truncate px-1">{member.name}</p>
                {member.specialty && <p className="text-xs text-muted-foreground mt-0.5 truncate">{member.specialty}</p>}
                {member.joinDate && (
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" />{new Date(member.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
                <div className="mt-2">
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-muted-foreground">{ROLE_ICONS[member.role] || '•'} {member.role || 'Member'}</span>
                </div>

                {isAdmin && (
                  <div className="absolute top-2 right-2 hidden group-hover:flex flex-col gap-1">
                    <button onClick={() => confirm(`Kick ${member.name}?`) && kickMutation.mutate(member.id)}
                      className="p-1.5 bg-orange-900/60 hover:bg-orange-800/80 rounded-lg" title="Kick">
                      <UserMinus className="w-3 h-3 text-orange-400" />
                    </button>
                    <button onClick={() => confirm(`Hapus ${member.name}?`) && deleteMutation.mutate(member.id)}
                      className="p-1.5 bg-red-900/60 hover:bg-red-800/80 rounded-lg" title="Hapus">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                )}

                {member.isKicked && (
                  <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                    <span className="text-xs text-red-400 font-bold">Dikick</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
