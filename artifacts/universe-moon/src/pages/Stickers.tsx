import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, Trash2, Sticker } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = ['General', 'Lucu', 'Emosi', 'Spesial', 'UM Exclusive'];

export default function Stickers() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('General');
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: stickers = [], isLoading } = useQuery({
    queryKey: ['custom-stickers'],
    queryFn: () => fetch('/api/custom-stickers').then(r => r.json()),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUrl(data.url || '');
    setUploading(false);
  };

  const addMutation = useMutation({
    mutationFn: () => fetch('/api/custom-stickers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, category, addedBy: user?.username }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-stickers'] });
      setName(''); setUrl(''); setCategory('General'); setShowForm(false);
      toast({ title: '🎉 Stiker ditambahkan!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/custom-stickers/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-stickers'] }),
  });

  const handleCopy = (sticker: any) => {
    navigator.clipboard.writeText(sticker.url).then(() => {
      setCopiedId(sticker.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const categories = ['Semua', ...Array.from(new Set((stickers as any[]).map((s: any) => s.category || 'General')))];
  const filtered = activeCategory === 'Semua' ? stickers : (stickers as any[]).filter((s: any) => s.category === activeCategory);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow">🎭 Stiker Kustom</h1>
          <p className="text-muted-foreground text-sm mt-1">Koleksi stiker eksklusif Universe Moon</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Tambah Stiker
          </button>
        )}
      </div>

      {user?.role !== 'admin' && stickers.length === 0 && (
        <div className="glass rounded-2xl p-4 mb-6 text-center text-sm text-muted-foreground">
          Stiker kustom akan ditambahkan oleh admin 🎭
        </div>
      )}

      {showForm && user?.role === 'admin' && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Tambah Stiker</h2>
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama stiker..." className="um-input w-full" />
            <select value={category} onChange={e => setCategory(e.target.value)} className="um-input w-full">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div>
              <label className="block">
                <div className={`border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 transition-colors`}>
                  {url ? (
                    <img src={url} alt="sticker preview" className="max-h-32 mx-auto rounded-xl object-contain" />
                  ) : (
                    <>
                      <Sticker className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Klik untuk upload stiker'}</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => addMutation.mutate()} disabled={!name || !url} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Tambahkan</button>
              <button onClick={() => setShowForm(false)} className="px-4 text-sm text-muted-foreground hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === cat ? 'bg-white/20 text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>{cat}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="glass rounded-xl aspect-square animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Sticker className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p>Belum ada stiker</p>
          {user?.role === 'admin' && <p className="text-xs mt-2">Tambahkan stiker di atas</p>}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {(filtered as any[]).map((s: any) => (
            <div key={s.id} className="group relative">
              <button onClick={() => handleCopy(s)} className="glass rounded-2xl p-3 w-full aspect-square flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                <img src={s.url} alt={s.name} className="w-16 h-16 object-contain" />
                {copiedId === s.id && (
                  <div className="absolute inset-0 glass rounded-2xl flex items-center justify-center bg-white/10">
                    <p className="text-xs text-green-400">Copied!</p>
                  </div>
                )}
              </button>
              <p className="text-xs text-center text-muted-foreground mt-1 truncate">{s.name}</p>
              {user?.role === 'admin' && (
                <button onClick={() => deleteMutation.mutate(s.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-center text-muted-foreground mt-6">Klik stiker untuk copy URL-nya</p>
    </div>
  );
}
