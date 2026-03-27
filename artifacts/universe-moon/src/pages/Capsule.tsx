import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, Lock, Unlock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const REACTION_EMOJIS = ['❤️', '🔥', '😭', '✨', '🥹', '👏'];

export default function Capsule() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [revealDate, setRevealDate] = useState('');

  const { data: capsules = [], isLoading } = useQuery({
    queryKey: ['capsules'],
    queryFn: () => fetch('/api/capsules').then(r => r.json()),
    refetchInterval: 60000,
  });

  const postMutation = useMutation({
    mutationFn: () => fetch('/api/capsules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorUsername: user?.username, title, content, revealDate }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['capsules'] });
      setTitle(''); setContent(''); setRevealDate(''); setShowForm(false);
      toast({ title: '📦 Kapsul tersimpan!' });
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({ id, emoji }: { id: number; emoji: string }) => fetch(`/api/capsules/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username, emoji }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capsules'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/capsules/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capsules'] }),
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow">📦 Surat Rahasia</h1>
          <p className="text-muted-foreground text-sm mt-1">Time capsule komunitas — terbuka di hari yang ditentukan</p>
        </div>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Tulis
          </button>
        )}
      </div>

      {!user && (
        <div className="glass rounded-2xl p-4 mb-6 text-center text-sm text-muted-foreground">
          Login untuk menulis surat rahasia ✉️
        </div>
      )}

      {showForm && user && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Tulis Surat Rahasia</h2>
          <div className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul surat..." className="um-input w-full" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Tulis pesanmu yang akan dibuka di masa depan..." className="um-input w-full h-32 resize-none" />
            <div>
              <label className="text-xs text-muted-foreground">Tanggal dibuka</label>
              <input type="date" value={revealDate} onChange={e => setRevealDate(e.target.value)} min={minDate} className="um-input w-full mt-1" />
            </div>
            {revealDate && (
              <div className="glass rounded-xl p-3 text-xs text-muted-foreground">
                🔒 Kapsul ini akan terbuka pada {new Date(revealDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => postMutation.mutate()} disabled={!title || !content || !revealDate} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Simpan Kapsul 📦</button>
              <button onClick={() => setShowForm(false)} className="px-4 text-sm text-muted-foreground hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-36 animate-pulse" />)}</div>
      ) : capsules.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg">Belum ada surat rahasia</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(capsules as any[]).map((c: any) => {
            const reactions = (c.reactions || {}) as Record<string, string[]>;
            const isLocked = !c.isRevealed;
            return (
              <div key={c.id} className={`glass rounded-2xl p-5 group ${isLocked ? 'opacity-90' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLocked ? 'bg-white/5' : 'bg-white/10'}`}>
                      {isLocked ? <Lock className="w-5 h-5 text-muted-foreground" /> : <Unlock className="w-5 h-5 text-yellow-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        oleh @{c.authorUsername} · Dibuka: {new Date(c.revealDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => deleteMutation.mutate(c.id)} className="p-2 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className={`text-sm leading-relaxed ${isLocked ? 'text-muted-foreground italic' : ''}`}>{c.content}</p>
                {!isLocked && (
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {REACTION_EMOJIS.map(emoji => {
                      const count = reactions[emoji]?.length || 0;
                      const reacted = user ? reactions[emoji]?.includes(user.username) : false;
                      return (
                        <button key={emoji} onClick={() => user && reactMutation.mutate({ id: c.id, emoji })} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${reacted ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'} ${!user ? 'opacity-50 cursor-default' : ''}`}>
                          {emoji}{count > 0 && <span>{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
