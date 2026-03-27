import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { Plus, X, Image as ImageIcon, Upload, Heart, Calendar, Expand, Download, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function Gallery() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [openAdd, setOpenAdd] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ caption: '', url: '' });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: photos = [] } = useQuery({
    queryKey: ['photos'],
    queryFn: () => fetch('/api/photos').then(r => r.json()),
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/photos/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['photos'] }); setSelected(null); },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleAdd = async () => {
    if (!file && !form.url.trim()) return toast({ title: 'Pilih foto atau masukkan URL!', variant: 'destructive' });
    setUploading(true);
    try {
      let imageUrl = form.url.trim();
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'photo');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (res.ok) { const d = await res.json(); imageUrl = d.url; }
      }
      if (!imageUrl) return toast({ title: 'Gagal upload foto!', variant: 'destructive' });
      await fetch('/api/photos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl, caption: form.caption, uploadedBy: user?.username }),
      });
      qc.invalidateQueries({ queryKey: ['photos'] });
      setForm({ caption: '', url: '' }); setFile(null); setPreview(null); setOpenAdd(false);
      toast({ title: 'Foto berhasil ditambahkan!' });
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold">🖼️ Galeri Universe Moon</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{photos.length} foto kenangan</p>
        </div>
        {!isGuest && (
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors">
                <Plus className="w-4 h-4" /> Tambah Foto
              </button>
            </DialogTrigger>
            <DialogContent className="glass border border-white/20 max-w-md">
              <DialogHeader><DialogTitle>Tambah Foto ke Galeri</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                {/* Preview */}
                {preview ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                    <img src={preview} alt="preview" className="w-full h-full object-contain" />
                    <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Klik untuk upload foto</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, GIF (maks 10MB)</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
                <div className="text-center text-xs text-muted-foreground">— atau —</div>
                <input value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))}
                  placeholder="URL foto langsung" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <textarea value={form.caption} onChange={e => setForm(f => ({...f, caption: e.target.value}))}
                  placeholder="Caption (opsional)..." rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none" />
                <button onClick={handleAdd} disabled={uploading || (!file && !form.url.trim())}
                  className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 rounded-xl font-semibold disabled:opacity-50">
                  {uploading ? 'Mengunggah...' : 'Tambahkan'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {photos.length === 0 && (
        <div className="glass rounded-2xl p-16 text-center">
          <ImageIcon className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Belum ada foto. Jadilah yang pertama menambahkan kenangan!</p>
        </div>
      )}

      <div className="columns-2 sm:columns-3 gap-3 space-y-3">
        {photos.map((photo: any, i: number) => (
          <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
            className="break-inside-avoid glass rounded-2xl overflow-hidden cursor-pointer group relative hover:border-white/20 border border-transparent transition-all"
            onClick={() => setSelected(photo)}>
            <img src={photo.url || photo.fileUrl} alt={photo.caption || 'foto'} className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {photo.caption && <p className="text-xs text-white truncate">{photo.caption}</p>}
                <div className="flex items-center justify-between mt-1">
                  {photo.uploadedBy && <span className="text-[10px] text-white/70">{photo.uploadedBy}</span>}
                  <Expand className="w-4 h-4 text-white/80 ml-auto" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[80vh] w-full" onClick={e => e.stopPropagation()}>
              <img src={selected.url || selected.fileUrl} alt={selected.caption} className="max-w-full max-h-[70vh] mx-auto object-contain rounded-2xl" />
              <div className="flex items-center justify-between mt-4 px-2">
                <div>
                  {selected.caption && <p className="text-white font-medium">{selected.caption}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    {selected.uploadedBy && <span className="text-white/60 text-sm">by {selected.uploadedBy}</span>}
                    {selected.createdAt && <span className="text-white/40 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(selected.createdAt).toLocaleDateString('id-ID')}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <button onClick={() => deleteMutation.mutate(selected.id)} className="p-2.5 bg-red-900/60 hover:bg-red-800 rounded-xl">
                      <Trash2 className="w-4 h-4 text-red-300" />
                    </button>
                  )}
                  <button onClick={() => setSelected(null)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
