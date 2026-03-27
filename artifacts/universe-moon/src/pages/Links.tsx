import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Links() {
  const { user, isGuest } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', url: '', description: '', category: 'Lainnya', addedBy: user?.username || '' });

  const categories = [
    { name: 'Social Media', icon: '📱' },
    { name: 'Grup', icon: '💬' },
    { name: 'Musik', icon: '🎵' },
    { name: 'Lainnya', icon: '🔗' }
  ];

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['links'],
    queryFn: async () => {
      const res = await fetch('/api/links');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newLink) => {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink)
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast({ title: 'Link added' });
      setShowForm(false);
      setFormData({ title: '', url: '', description: '', category: 'Lainnya', addedBy: user?.username || '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast({ title: 'Link deleted' });
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
          <h1 className="text-3xl font-serif font-bold mb-2">Koleksi Links</h1>
          <p className="text-sm text-muted-foreground">Tautan penting di Universe Moon</p>
        </div>
        {user && !isGuest && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-white text-black px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200"
          >
            <Plus className="w-4 h-4"/> Tambah Link
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass p-6 rounded-2xl overflow-hidden mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Title</label>
                  <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">URL</label>
                  <input type="url" required value={formData.url} onChange={e=>setFormData({...formData, url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Category</label>
                  <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary [&>option]:bg-background">
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Description</label>
                  <input value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
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
        <div className="text-center py-10 text-muted-foreground">Memuat links...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link: any, i: number) => {
            const cat = categories.find(c => c.name === link.category) || categories[3];
            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={link.id || i} className="glass p-5 rounded-2xl group flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl shadow-inner">
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm line-clamp-1">{link.title}</h3>
                      <span className="text-[10px] uppercase font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{link.category}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => { if(confirm('Hapus link?')) deleteMutation.mutate(link.id); }} className="text-destructive/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mb-4 flex-1 line-clamp-2">{link.description}</p>
                
                <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-3">
                  <span className="text-[10px] text-muted-foreground">By {link.addedBy || 'Anon'}</span>
                  <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold hover:text-primary transition-colors">
                    Kunjungi <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
