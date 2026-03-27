import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/use-sound';

export default function Vault() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const { playSfx } = useSound();
  const queryClient = useQueryClient();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newSecret, setNewSecret] = useState('');

  const { data: secrets = [], isLoading } = useQuery({
    queryKey: ['secrets'],
    queryFn: async () => {
      const res = await fetch('/api/secrets');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isUnlocked // Only fetch if unlocked
  });

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === 'UM2025') {
      setIsUnlocked(true);
      playSfx('notification');
      toast({ title: 'Vault Unlocked' });
    } else {
      playSfx('error');
      toast({ title: 'Invalid PIN', variant: 'destructive' });
      setPin('');
    }
  };

  const addMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, addedBy: user?.username || 'Anon' })
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      toast({ title: 'Rahasia disimpan' });
      setShowForm(false);
      setNewSecret('');
    }
  });

  const toggleRevealMutation = useMutation({
    mutationFn: async ({ id, revealed }: { id: number, revealed: boolean }) => {
      const res = await fetch(`/api/secrets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRevealed: !revealed })
      });
      if (!res.ok) throw new Error('Failed to update');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/secrets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      toast({ title: 'Rahasia dihapus' });
    }
  });

  if (!isUnlocked) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center animate-in zoom-in duration-500">
        <div className="glass p-10 rounded-3xl text-center max-w-sm w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay pointer-events-none"></div>
          <div className="w-20 h-20 bg-black/50 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,0,0,0.2)]">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2">Vault Rahasia</h1>
          <p className="text-sm text-muted-foreground mb-8">Hanya untuk yang tahu.</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <input 
              type="password" 
              value={pin} 
              onChange={e=>setPin(e.target.value)} 
              placeholder="Masukkan PIN" 
              className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-center tracking-[0.5em] focus:outline-none focus:border-red-400 font-mono transition-colors"
            />
            <button type="submit" className="w-full bg-white text-black font-bold rounded-xl py-3 hover:bg-gray-200 transition-colors">
              Buka
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Unlock className="w-6 h-6 text-green-400" />
          <div>
            <h1 className="text-2xl font-serif font-bold">Vault Rahasia</h1>
            <p className="text-xs text-muted-foreground">Unlocked. Rahasia aman di sini.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {user && (
            <button onClick={() => setShowForm(!showForm)} className="bg-white/10 text-white px-4 py-2 rounded-full text-xs hover:bg-white/20 transition-colors">
              Tambah Rahasia
            </button>
          )}
          <button onClick={() => setIsUnlocked(false)} className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">
            Kunci Kembali
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass p-6 rounded-2xl overflow-hidden">
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">Tulis Rahasia</label>
                <textarea value={newSecret} onChange={e=>setNewSecret(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={4} placeholder="Ceritakan yang tak bisa diceritakan..."></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5">Batal</button>
                <button onClick={() => addMutation.mutate(newSecret)} disabled={!newSecret || addMutation.isPending} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200">Simpan Rahasia</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="text-center py-10">Membongkar brankas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {secrets.map((secret: any) => (
            <div key={secret.id} className="glass p-6 rounded-3xl relative group">
              {isAdmin && (
                <button onClick={() => { if(confirm('Hapus rahasia?')) deleteMutation.mutate(secret.id); }} className="absolute top-4 right-4 text-destructive/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1 bg-black/50 rounded-md">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground border-b border-white/10 pb-3">
                <Lock className="w-3 h-3" /> Rahasia #{secret.id}
              </div>

              <div 
                className={`text-sm leading-relaxed transition-all duration-500 cursor-pointer ${!secret.isRevealed ? 'blur-md select-none opacity-50' : ''}`}
                onClick={() => {
                  if(!secret.isRevealed) toggleRevealMutation.mutate({ id: secret.id, revealed: false });
                }}
              >
                {secret.content}
              </div>
              
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                <button 
                  onClick={() => toggleRevealMutation.mutate({ id: secret.id, revealed: secret.isRevealed })}
                  className="text-[10px] text-muted-foreground hover:text-white flex items-center gap-1 uppercase tracking-wider"
                >
                  {secret.isRevealed ? <><EyeOff className="w-3 h-3"/> Sembunyikan</> : <><Eye className="w-3 h-3"/> Tampilkan</>}
                </button>
                {secret.addedBy && <span className="text-[10px] text-muted-foreground italic">- {secret.addedBy}</span>}
              </div>
            </div>
          ))}
          {secrets.length === 0 && <div className="col-span-2 text-center text-muted-foreground py-10">Vault kosong.</div>}
        </div>
      )}
    </div>
  );
}
