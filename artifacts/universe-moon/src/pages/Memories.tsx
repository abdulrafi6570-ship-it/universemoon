import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/use-sound';

export default function Memories() {
  const { user, isGuest } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member' || isAdmin;
  const { toast } = useToast();
  const { playSfx } = useSound();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', date: '', addedBy: user?.username || '', photoUrl: '' });

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const res = await fetch('/api/memories');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newMem) => {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMem)
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast({ title: 'Memory added' });
      setShowForm(false);
      setFormData({ title: '', content: '', date: '', addedBy: user?.username || '', photoUrl: '' });
      playSfx('notification');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast({ title: 'Memory deleted' });
      playSfx('notification');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Memories</h1>
          <p className="text-sm text-muted-foreground">Jejak langkah di semesta yang tak akan terlupakan ✨</p>
        </div>
        {isMember && !isGuest && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-white text-black px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200"
          >
            <Plus className="w-4 h-4"/> Catat Memory
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass p-6 rounded-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Title</label>
                  <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Date</label>
                  <input type="date" required value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Content</label>
                  <textarea required value={formData.content} onChange={e=>setFormData({...formData, content: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={3}></textarea>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Photo URL (optional)</label>
                  <input value={formData.photoUrl} onChange={e=>setFormData({...formData, photoUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
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

      <div className="relative pl-6 md:pl-8 py-4">
        {/* Vertical Line */}
        <div className="absolute top-0 bottom-0 left-[11px] md:left-[15px] w-px bg-white/10"></div>
        
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Mencari memori...</div>
        ) : memories.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Belum ada memori tercatat.</div>
        ) : (
          <div className="space-y-12">
            {memories.map((mem: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.1 }}
                key={mem.id || i} 
                className="relative"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-[30px] md:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] z-10"></div>
                
                <div className="glass p-6 rounded-2xl group hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-primary mb-2 font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(mem.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <h3 className="text-xl font-serif font-bold">{mem.title}</h3>
                    </div>
                    {isAdmin && (
                      <button onClick={() => { if(confirm('Hapus memori?')) deleteMutation.mutate(mem.id); }} className="text-destructive/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
                    {mem.content}
                  </p>
                  
                  {mem.photoUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden max-h-64 border border-white/10">
                      <img src={mem.photoUrl} alt={mem.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground text-right border-t border-white/5 pt-3 mt-2">
                    Ditambahkan oleh {mem.addedBy || 'Anonim'}
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
