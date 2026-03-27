import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, BookOpen, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = ['Umum', 'Chat', 'Konten', 'Privasi', 'Event', 'Games', 'FAQ'];

export default function Rules() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Umum');
  const [activeCategory, setActiveCategory] = useState('Semua');

  const { data: rules = [] } = useQuery({
    queryKey: ['rules'],
    queryFn: () => fetch('/api/rules').then(r => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: () => fetch('/api/rules', {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category }),
    }).then(async r => {
      if (editId) return fetch(`/api/rules/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, category }) }).then(r => r.json());
      return r.json();
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] });
      setShowForm(false); setEditId(null); setTitle(''); setContent(''); setCategory('Umum');
      toast({ title: '✅ Peraturan disimpan!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/rules/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  });

  const handleEdit = (rule: any) => {
    setEditId(rule.id); setTitle(rule.title); setContent(rule.content); setCategory(rule.category || 'Umum');
    setShowForm(true);
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    if (editId) {
      fetch(`/api/rules/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, category }) })
        .then(() => { qc.invalidateQueries({ queryKey: ['rules'] }); setShowForm(false); setEditId(null); setTitle(''); setContent(''); setCategory('Umum'); toast({ title: '✅ Peraturan diperbarui!' }); });
    } else {
      fetch('/api/rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, category }) })
        .then(() => { qc.invalidateQueries({ queryKey: ['rules'] }); setShowForm(false); setTitle(''); setContent(''); setCategory('Umum'); toast({ title: '✅ Peraturan ditambahkan!' }); });
    }
  };

  const categories = ['Semua', ...Array.from(new Set((rules as any[]).map((r: any) => r.category || 'Umum')))];
  const filtered = activeCategory === 'Semua' ? rules : (rules as any[]).filter((r: any) => r.category === activeCategory);

  const CATEGORY_ICONS: Record<string, string> = { 'Umum': '📋', 'Chat': '💬', 'Konten': '🎨', 'Privasi': '🔒', 'Event': '🎉', 'Games': '🎮', 'FAQ': '❓' };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow flex items-center gap-2"><BookOpen className="w-7 h-7" /> Peraturan & FAQ</h1>
          <p className="text-muted-foreground text-sm mt-1">Tata tertib komunitas Universe Moon</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setTitle(''); setContent(''); }} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        )}
      </div>

      {showForm && user?.role === 'admin' && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">{editId ? 'Edit' : 'Tambah'} Peraturan</h2>
          <div className="space-y-3">
            <select value={category} onChange={e => setCategory(e.target.value)} className="um-input w-full">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul peraturan..." className="um-input w-full" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Isi peraturan atau penjelasan..." className="um-input w-full h-24 resize-none" />
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                <Check className="w-4 h-4" /> Simpan
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === cat ? 'bg-white/20 text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>
            {CATEGORY_ICONS[cat] || '📌'} {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Belum ada peraturan yang ditambahkan</p>
          {user?.role === 'admin' && <p className="text-xs mt-2">Tambahkan peraturan di atas</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {(filtered as any[]).map((rule: any, idx: number) => (
            <div key={rule.id} className="glass rounded-2xl p-5 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs glass px-2 py-0.5 rounded-full text-muted-foreground">
                        {CATEGORY_ICONS[rule.category] || '📌'} {rule.category}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">{rule.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{rule.content}</p>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => handleEdit(rule)} className="p-2 text-muted-foreground hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteMutation.mutate(rule.id)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
