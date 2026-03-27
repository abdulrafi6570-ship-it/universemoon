import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { UsersRound, Calendar, CheckCircle, Plus, Trash2, TrendingUp, Clock, ExternalLink, X, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function OpMemPage() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [openCreate, setOpenCreate] = useState(false);
  const [openAccept, setOpenAccept] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', description: '', targetCount: 50, openDate: '', closeDate: '', tiktokLink: '' });
  const [acceptForm, setAcceptForm] = useState({ name: '', tiktokUsername: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: list = [] } = useQuery({
    queryKey: ['opmem'],
    queryFn: () => fetch('/api/opmem').then(r => r.json()),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/opmem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opmem'] });
      setOpenCreate(false);
      setForm({ title: '', description: '', targetCount: 50, openDate: '', closeDate: '', tiktokLink: '' });
      toast({ title: 'OpMem berhasil dibuat!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/opmem/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opmem'] }),
  });

  const addAccepted = async (opmemId: number) => {
    if (!acceptForm.name.trim()) return toast({ title: 'Nama wajib diisi!', variant: 'destructive' });
    setUploading(true);
    try {
      let tiktokPhotoUrl = '';
      if (photoFile) {
        const fd = new FormData();
        fd.append('file', photoFile);
        fd.append('type', 'avatar');
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (upRes.ok) { const d = await upRes.json(); tiktokPhotoUrl = d.url; }
      }
      await fetch(`/api/opmem/${opmemId}/accepted`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...acceptForm, tiktokPhotoUrl }),
      });
      qc.invalidateQueries({ queryKey: ['opmem'] });
      setAcceptForm({ name: '', tiktokUsername: '' });
      setPhotoFile(null); setPhotoPreview(null);
      setOpenAccept(null);
      toast({ title: 'Member berhasil ditambahkan!' });
    } finally { setUploading(false); }
  };

  const removeAccepted = async (opmemId: number, idx: number) => {
    if (!confirm('Hapus member ini?')) return;
    await fetch(`/api/opmem/${opmemId}/accepted/${idx}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['opmem'] });
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  const getStatus = (opmem: any) => {
    const now = new Date();
    const open = opmem.openDate ? new Date(opmem.openDate) : null;
    const close = opmem.closeDate ? new Date(opmem.closeDate) : null;
    if (close && now > close) return { label: 'Ditutup', color: 'text-red-400 bg-red-900/20 border-red-500/20' };
    if (open && now < open) return { label: 'Akan Dibuka', color: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/20' };
    return { label: 'Buka', color: 'text-green-400 bg-green-900/20 border-green-500/20' };
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold">OpMem Universe Moon</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Pembukaan Member — daftar dan bergabunglah!</p>
        </div>
        {isAdmin && (
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors">
                <Plus className="w-4 h-4" /> Buat OpMem
              </button>
            </DialogTrigger>
            <DialogContent className="glass border border-white/20 max-w-md">
              <DialogHeader><DialogTitle>Buat OpMem Baru</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Judul OpMem*" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Persyaratan & deskripsi..." rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none" />
                <input value={form.tiktokLink} onChange={e => setForm(f => ({ ...f, tiktokLink: e.target.value }))}
                  placeholder="Link TikTok/WA pendaftaran (opsional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Tanggal Buka</label>
                    <input type="datetime-local" value={form.openDate} onChange={e => setForm(f => ({ ...f, openDate: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Tanggal Tutup</label>
                    <input type="datetime-local" value={form.closeDate} onChange={e => setForm(f => ({ ...f, closeDate: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Target member:</label>
                  <input type="number" value={form.targetCount} onChange={e => setForm(f => ({ ...f, targetCount: +e.target.value }))} min={1} max={999}
                    className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <button onClick={() => createMutation.mutate(form)} disabled={!form.title.trim()}
                  className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 rounded-xl font-semibold disabled:opacity-50">Buat OpMem</button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {list.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <UsersRound className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Belum ada OpMem aktif. Nantikan pengumuman selanjutnya!</p>
        </div>
      )}

      {list.map((opmem: any) => {
        const status = getStatus(opmem);
        const accepted: any[] = opmem.acceptedMembers || [];
        const progress = opmem.targetCount ? Math.min((accepted.length / opmem.targetCount) * 100, 100) : 0;

        return (
          <motion.div key={opmem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl overflow-hidden border border-white/10">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-serif text-xl font-bold">{opmem.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${status.color}`}>{status.label}</span>
                  </div>
                  {opmem.description && <p className="text-sm text-muted-foreground leading-relaxed">{opmem.description}</p>}
                </div>
                {isAdmin && (
                  <button onClick={() => deleteMutation.mutate(opmem.id)} className="p-2 text-destructive hover:bg-red-900/20 rounded-xl shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {opmem.openDate && (
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3">
                    <Calendar className="w-4 h-4 text-green-400 shrink-0" />
                    <div><p className="text-[10px] text-muted-foreground">Dibuka</p><p className="text-xs font-medium">{formatDate(opmem.openDate)}</p></div>
                  </div>
                )}
                {opmem.closeDate && (
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3">
                    <Clock className="w-4 h-4 text-red-400 shrink-0" />
                    <div><p className="text-[10px] text-muted-foreground">Ditutup</p><p className="text-xs font-medium">{formatDate(opmem.closeDate)}</p></div>
                  </div>
                )}
              </div>

              {opmem.targetCount && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Progress</span>
                    <span className="font-semibold">{accepted.length}/{opmem.targetCount} diterima</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              )}

              {opmem.tiktokLink && (
                <a href={opmem.tiktokLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline mb-4">
                  <ExternalLink className="w-4 h-4" /> Link pendaftaran
                </a>
              )}
            </div>

            {/* Accepted List */}
            <div className="border-t border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" /> Yang Diterima ({accepted.length})
                </h4>
                {isAdmin && (
                  <button onClick={() => setOpenAccept(opmem.id)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                )}
              </div>
              {accepted.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">Belum ada yang diterima.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {accepted.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 rounded-xl p-2.5 group relative hover:bg-white/8 transition-colors">
                      {a.tiktokPhotoUrl ? (
                        <img src={a.tiktokPhotoUrl} alt={a.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-400 shrink-0">
                          {a.name?.substring(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{a.name}</p>
                        {a.tiktokUsername && <p className="text-[10px] text-pink-400 truncate">@{a.tiktokUsername}</p>}
                      </div>
                      {isAdmin && (
                        <button onClick={() => removeAccepted(opmem.id, i)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:bg-red-900/30 rounded transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Add Accepted Dialog */}
      <Dialog open={openAccept !== null} onOpenChange={open => { if (!open) { setOpenAccept(null); setPhotoFile(null); setPhotoPreview(null); } }}>
        <DialogContent className="glass border border-white/20 max-w-sm">
          <DialogHeader><DialogTitle>Tambah Member Diterima</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <input value={acceptForm.name} onChange={e => setAcceptForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nama member*" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
            <input value={acceptForm.tiktokUsername} onChange={e => setAcceptForm(f => ({ ...f, tiktokUsername: e.target.value }))}
              placeholder="Username TikTok (tanpa @)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Foto Profil TikTok</label>
              {photoPreview ? (
                <div className="relative w-20 h-20">
                  <img src={photoPreview} className="w-20 h-20 rounded-full object-cover border border-white/20" alt="preview" />
                  <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute -top-1 -right-1 p-0.5 bg-black/80 rounded-full border border-white/20"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <label className="flex items-center gap-2 p-3 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary/50 transition-colors text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" /> Upload foto dari galeri
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setPhotoFile(f);
                    const reader = new FileReader();
                    reader.onload = () => setPhotoPreview(reader.result as string);
                    reader.readAsDataURL(f);
                  }} />
                </label>
              )}
            </div>
            <button onClick={() => openAccept !== null && addAccepted(openAccept)} disabled={!acceptForm.name.trim() || uploading}
              className="w-full py-3 bg-gradient-to-r from-green-700 to-emerald-700 rounded-xl font-semibold disabled:opacity-50">
              {uploading ? 'Mengunggah...' : 'Tambah'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
