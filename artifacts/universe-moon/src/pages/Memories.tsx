import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Memories() {
  const { user, isGuest } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member' || isAdmin;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', date: '', addedBy: user?.username || '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const res = await fetch('/api/memories');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: any) => {
      const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['memories'] }); toast({ title: 'Memori dihapus.' }); }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.date) {
      return toast({ title: 'Isi semua field yang wajib!', variant: 'destructive' });
    }
    setUploading(true);
    try {
      let photoUrl = '';
      if (photoFile) {
        const fd = new FormData();
        fd.append('file', photoFile);
        fd.append('type', 'photo');
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (upRes.ok) { const d = await upRes.json(); photoUrl = d.url; }
        else { toast({ title: 'Upload foto gagal', variant: 'destructive' }); setUploading(false); return; }
      }
      const res = await fetch('/api/memories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, addedBy: user?.username || formData.addedBy, photo: photoUrl || undefined }),
      });
      if (!res.ok) throw new Error('Failed');
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast({ title: 'Memory ditambahkan!' });
      setShowForm(false);
      setFormData({ title: '', content: '', date: '', addedBy: user?.username || '' });
      setPhotoFile(null); setPhotoPreview(null);
    } catch { toast({ title: 'Gagal menyimpan memori', variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-1">Memories</h1>
          <p className="text-sm text-muted-foreground">Jejak langkah di semesta yang tak akan terlupakan</p>
        </div>
        {isMember && !isGuest && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-white text-black px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200">
            <Plus className="w-4 h-4" /> Catat Memory
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass p-6 rounded-2xl overflow-hidden border border-white/10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Judul*</label>
                  <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nama momen..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Tanggal*</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Cerita*</label>
                  <textarea required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Ceritakan momennya..." rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Foto (opsional)</label>
                  {photoPreview ? (
                    <div className="relative rounded-xl overflow-hidden h-48">
                      <img src={photoPreview} className="w-full h-full object-cover" alt="preview" />
                      <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Klik untuk pilih foto</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG (maks 10MB)</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-white/5">Batal</button>
                <button type="submit" disabled={uploading}
                  className="px-5 py-2 bg-white text-black rounded-xl text-sm font-semibold hover:bg-gray-200 disabled:opacity-50">
                  {uploading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pl-6 md:pl-8 py-4">
        <div className="absolute top-0 bottom-0 left-[11px] md:left-[15px] w-px bg-white/10" />
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Mencari memori...</div>
        ) : memories.length === 0 ? (
          <div className="text-center py-16">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada memori tercatat. Jadilah yang pertama!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {memories.map((mem: any, i: number) => (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                key={mem.id || i} className="relative">
                <div className="absolute -left-[30px] md:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary shadow-[0_0_10px_rgba(139,92,246,0.4)] z-10" />
                <div className="glass p-6 rounded-2xl group hover:border-white/20 border border-white/5 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-primary mb-2 font-mono">
                        <Calendar className="w-3 h-3" />
                        {mem.date ? new Date(mem.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                      </div>
                      <h3 className="text-xl font-serif font-bold">{mem.title}</h3>
                    </div>
                    {isAdmin && (
                      <button onClick={() => { if (confirm('Hapus memori?')) deleteMutation.mutate(mem.id); }}
                        className="text-destructive/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-900/20 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">{mem.content}</p>
                  {mem.photo && (
                    <div className="mb-4 rounded-xl overflow-hidden max-h-72 border border-white/10">
                      <img src={mem.photo} alt={mem.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground text-right border-t border-white/5 pt-3 mt-2">
                    Ditambahkan oleh <span className="text-white/70">{mem.addedBy || 'Anonim'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
