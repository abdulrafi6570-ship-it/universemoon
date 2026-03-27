import { useState } from 'react';
import { useGetPhotos, useAddPhoto, useDeletePhoto } from '@workspace/api-client-react';
import { useAuthStore } from '@/hooks/use-auth';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Moments', 'Selca', 'Random'];

export default function Gallery() {
  const [filter, setFilter] = useState('All');
  const { data: photos = [], refetch } = useGetPhotos(filter !== 'All' ? { category: filter } : undefined);
  const { user, isGuest } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  
  const addMutation = useAddPhoto();
  const deleteMutation = useDeletePhoto();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Moments');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMutation.mutateAsync({ data: { url, caption, category, uploadedBy: user?.username || 'Unknown' }});
      setOpen(false);
      setUrl(''); setCaption('');
      toast({ title: "Foto ditambahkan!" });
      refetch();
    } catch(e) {
      toast({ title: "Gagal", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Galeri Kenangan</h1>
          <p className="text-sm text-muted-foreground">Momen yang tertangkap kamera 📸</p>
        </div>
        {!isGuest && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="bg-white text-black px-4 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 w-full md:w-auto">
              <Plus className="w-4 h-4"/> Tambah Foto
            </DialogTrigger>
            <DialogContent className="glass border-white/10 text-white sm:max-w-md">
              <DialogHeader><DialogTitle>Upload Momen</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 pt-4">
                <div>
                  <label className="text-xs text-muted-foreground">URL Gambar (Unsplash/Imgur dll)</label>
                  <input required value={url} onChange={e=>setUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Caption</label>
                  <input value={caption} onChange={e=>setCaption(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm" placeholder="Ceritakan momen ini..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Kategori</label>
                  <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm">
                    <option>Moments</option>
                    <option>Selca</option>
                    <option>Random</option>
                  </select>
                </div>
                <button disabled={addMutation.isPending} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200">Upload</button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {CATEGORIES.map(c => (
          <button 
            key={c} 
            onClick={() => setFilter(c)}
            className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors border ${filter === c ? 'bg-white text-black border-white' : 'glass text-muted-foreground hover:text-white'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Belum ada foto. Jadilah yang pertama!</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          <AnimatePresence>
            {photos.map(photo => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                key={photo.id} className="relative group break-inside-avoid glass rounded-2xl overflow-hidden"
              >
                <img src={photo.url} alt={photo.caption} className="w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-sm font-medium leading-tight mb-1">{photo.caption}</p>
                  <p className="text-[10px] text-muted-foreground">By {photo.uploadedBy}</p>
                </div>
                {(isAdmin || user?.username === photo.uploadedBy) && (
                  <button onClick={() => deleteMutation.mutateAsync({ id: photo.id }).then(()=>refetch())} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive transition-all">
                    <X className="w-4 h-4"/>
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
