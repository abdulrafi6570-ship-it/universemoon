import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Video, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper to extract youtube embed URL
function getEmbedUrl(url: string) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match && match[1] ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export default function Mep() {
  const { user, isGuest } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', videoUrl: '', participants: '', createdBy: user?.username || '' });

  const { data: meps = [], isLoading } = useQuery({
    queryKey: ['mep'],
    queryFn: async () => {
      const res = await fetch('/api/mep');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newMep) => {
      const res = await fetch('/api/mep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMep)
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mep'] });
      toast({ title: 'MEP ditambahkan' });
      setShowForm(false);
      setFormData({ title: '', description: '', videoUrl: '', participants: '', createdBy: user?.username || '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/mep/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mep'] });
      toast({ title: 'MEP dihapus' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">MEP Videos</h1>
          <p className="text-sm text-muted-foreground">Karya kolaborasi (Multi Editor Project) Universe Moon</p>
        </div>
        {user && !isGuest && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-white text-black px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200"
          >
            <Plus className="w-4 h-4"/> Tambah MEP
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass p-6 rounded-3xl overflow-hidden mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Title</label>
                  <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">YouTube URL</label>
                  <input type="url" required value={formData.videoUrl} onChange={e=>setFormData({...formData, videoUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Participants (comma separated)</label>
                  <input value={formData.participants} onChange={e=>setFormData({...formData, participants: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Alice, Bob, Charlie..." />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Description</label>
                  <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={2}></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5">Batal</button>
                <button type="submit" disabled={addMutation.isPending} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200">Simpan</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Memuat video...</div>
      ) : meps.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Belum ada project MEP.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {meps.map((mep: any) => (
            <div key={mep.id} className="glass rounded-3xl overflow-hidden group">
              <div className="aspect-video w-full bg-black">
                <iframe 
                  src={getEmbedUrl(mep.videoUrl)} 
                  title={mep.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-6 relative">
                {isAdmin && (
                  <button onClick={() => { if(confirm('Hapus video?')) deleteMutation.mutate(mep.id); }} className="absolute top-6 right-6 text-destructive/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1.5 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <h3 className="text-xl font-bold font-serif mb-2 pr-8">{mep.title}</h3>
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">{mep.description}</p>
                
                {mep.participants && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs font-bold mb-2 text-primary">
                      <Users className="w-3.5 h-3.5" /> Participants
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mep.participants.split(',').map((p: string, i: number) => (
                        <span key={i} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-sm">{p.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
