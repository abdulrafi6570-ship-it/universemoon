import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Video, Users, Play, X, Upload, ExternalLink, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

function VideoPlayer({ mep, onClose }: { mep: any; onClose: () => void }) {
  const ytId = mep.url ? getYouTubeId(mep.url) : null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl glass rounded-2xl overflow-hidden border border-white/20"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="font-semibold">{mep.title}</h3>
            {mep.description && <p className="text-xs text-muted-foreground">{mep.description}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        {ytId ? (
          <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            allow="autoplay; encrypted-media" className="w-full aspect-video" title={mep.title} />
        ) : mep.fileUrl ? (
          <video src={mep.fileUrl} controls autoPlay className="w-full aspect-video bg-black" />
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Tidak ada video</p>
          </div>
        )}
        {mep.participants && mep.participants.length > 0 && (
          <div className="p-4 border-t border-white/10">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Peserta MEP</p>
            <div className="flex flex-wrap gap-2">
              {mep.participants.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-1.5">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">{p.name?.substring(0,1).toUpperCase()}</div>
                  )}
                  <span className="text-xs font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function MepPage() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [openAdd, setOpenAdd] = useState(false);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', url: '', eventDate: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [participants, setParticipants] = useState<{ name: string; photoUrl: string }[]>([]);
  const [partName, setPartName] = useState('');
  const [partPhotoFile, setPartPhotoFile] = useState<File | null>(null);

  const { data: meps = [] } = useQuery({
    queryKey: ['mep'],
    queryFn: () => fetch('/api/mep').then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/mep/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mep'] }),
  });

  const addParticipant = async () => {
    if (!partName.trim()) return;
    let photoUrl = '';
    if (partPhotoFile) {
      const fd = new FormData();
      fd.append('file', partPhotoFile);
      fd.append('type', 'avatar');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) { const d = await res.json(); photoUrl = d.url; }
    }
    setParticipants(p => [...p, { name: partName.trim(), photoUrl }]);
    setPartName(''); setPartPhotoFile(null);
  };

  const handleAdd = async () => {
    if (!form.title.trim()) return toast({ title: 'Judul wajib diisi!', variant: 'destructive' });
    setUploading(true);
    try {
      let fileUrl = '';
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'video');
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (upRes.ok) { const d = await upRes.json(); fileUrl = d.url; }
      }
      await fetch('/api/mep', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fileUrl, participants, addedBy: user?.username }),
      });
      qc.invalidateQueries({ queryKey: ['mep'] });
      setForm({ title: '', description: '', url: '', eventDate: '' });
      setFile(null); setParticipants([]); setOpenAdd(false);
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold">🎬 MEP Collection</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Multi Editor Project — karya bersama Universe Moon</p>
        </div>
        {isAdmin && (
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors">
                <Plus className="w-4 h-4" /> Tambah MEP
              </button>
            </DialogTrigger>
            <DialogContent className="glass border border-white/20 max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Tambah MEP Baru</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  placeholder="Judul MEP*" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Deskripsi..." rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none" />
                <input type="date" value={form.eventDate} onChange={e => setForm(f => ({...f, eventDate: e.target.value}))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Sumber video:</p>
                  <input value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))}
                    placeholder="🔗 YouTube URL (opsional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-white transition-colors p-3 border border-dashed border-white/20 rounded-xl">
                    <Upload className="w-4 h-4" />
                    {file ? file.name : 'Upload file video (MP4)'}
                    <input type="file" accept="video/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">Peserta MEP:</p>
                  <div className="flex gap-2">
                    <input value={partName} onChange={e => setPartName(e.target.value)} placeholder="Nama peserta"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                    <button onClick={addParticipant} className="px-3 py-2 glass rounded-xl text-sm"><Plus className="w-4 h-4" /></button>
                  </div>
                  {participants.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {participants.map((p, i) => (
                        <div key={i} className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1 text-xs">
                          {p.name}
                          <button onClick={() => setParticipants(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={handleAdd} disabled={uploading || !form.title.trim()}
                  className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 rounded-xl font-semibold disabled:opacity-50">
                  {uploading ? 'Mengunggah...' : 'Tambahkan MEP'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {meps.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada MEP. Admin bisa menambahkan karya pertama!</p>
          </div>
        )}
        {meps.map((mep: any, i: number) => {
          const ytId = mep.url ? getYouTubeId(mep.url) : null;
          const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
          const partList: any[] = mep.participants || [];
          return (
            <motion.div key={mep.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl overflow-hidden hover:border-white/20 border border-transparent transition-all">
              <div className="relative group cursor-pointer" onClick={() => setActiveVideo(mep)}>
                {thumb ? (
                  <img src={thumb} alt={mep.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
                    <Video className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                </div>
                {mep.url && <div className="absolute top-2 right-2"><ExternalLink className="w-4 h-4 text-white/80" /></div>}
                {mep.fileUrl && <div className="absolute top-2 right-2"><Upload className="w-4 h-4 text-white/80" /></div>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{mep.title}</h3>
                    {mep.description && <p className="text-sm text-muted-foreground mt-1">{mep.description}</p>}
                  </div>
                  {isAdmin && (
                    <button onClick={() => deleteMutation.mutate(mep.id)} className="p-2 text-destructive hover:bg-red-900/20 rounded-lg shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  {mep.eventDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />{new Date(mep.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                  {partList.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />{partList.length} peserta
                    </span>
                  )}
                </div>
                {partList.length > 0 && (
                  <div className="flex -space-x-1 mt-2">
                    {partList.slice(0, 8).map((p: any, i: number) => (
                      p.photoUrl ? (
                        <img key={i} src={p.photoUrl} alt={p.name} title={p.name} className="w-7 h-7 rounded-full object-cover border-2 border-black" />
                      ) : (
                        <div key={i} title={p.name} className="w-7 h-7 rounded-full bg-primary/30 border-2 border-black flex items-center justify-center text-[10px] font-bold">{p.name?.substring(0,1).toUpperCase()}</div>
                      )
                    ))}
                    {partList.length > 8 && <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[9px]">+{partList.length-8}</div>}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeVideo && <VideoPlayer mep={activeVideo} onClose={() => setActiveVideo(null)} />}
      </AnimatePresence>
    </div>
  );
}
