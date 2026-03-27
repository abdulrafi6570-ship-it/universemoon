import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const REACTION_EMOJIS = ['❤️', '🔥', '👏', '🥰', '💜', '✨', '😭', '🎉'];

export default function Shoutout() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [toUsername, setToUsername] = useState('');
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState(() => localStorage.getItem('um_guest_name') || '');

  const { data: shoutouts = [], isLoading } = useQuery({
    queryKey: ['shoutouts'],
    queryFn: () => fetch('/api/shoutouts').then(r => r.json()),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => fetch('/api/members').then(r => r.json()),
  });

  const postMutation = useMutation({
    mutationFn: () => {
      const from = user?.username || (guestName ? `Tamu_${guestName}` : null);
      if (!from) return Promise.reject(new Error("Name required"));
      return fetch('/api/shoutouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUsername: from, toUsername, content }),
      }).then(r => r.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shoutouts'] });
      setContent(''); setToUsername(''); setShowForm(false);
      toast({ title: '📣 Shoutout terkirim!' });
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({ id, emoji }: { id: number; emoji: string }) => {
      const username = user?.username || (guestName ? `Tamu_${guestName}` : null);
      if (!username) return Promise.reject(new Error("Name required"));
      return fetch(`/api/shoutouts/${id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, emoji }),
      }).then(r => r.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shoutouts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/shoutouts/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shoutouts'] }),
  });

  const activeMembers = (members as any[]).filter((m: any) => m.isActive);

  const handleReact = (id: number, emoji: string) => {
    if (!user && !guestName) {
      const name = prompt('Siapa namamu?');
      if (!name) return;
      localStorage.setItem('um_guest_name', name);
      setGuestName(name);
    }
    reactMutation.mutate({ id, emoji });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow flex items-center gap-2"><Megaphone className="w-7 h-7" /> Shoutout Board</h1>
          <p className="text-muted-foreground text-sm mt-1">Apresiasi sesama anggota UM 💜</p>
        </div>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Shoutout
          </button>
        )}
      </div>

      {!user && (
        <div className="glass rounded-2xl p-4 mb-6 text-center text-sm text-muted-foreground">
          Login untuk kirim shoutout ke sesama member UM 📣
        </div>
      )}

      {showForm && user && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Kirim Shoutout</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Kepada</label>
              <select value={toUsername} onChange={e => setToUsername(e.target.value)} className="um-input w-full mt-1">
                <option value="">Pilih member...</option>
                {activeMembers.map((m: any) => (
                  <option key={m.id} value={m.name}>{m.nickname || m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Pesan</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Tulis apresiasimu..." className="um-input w-full h-24 resize-none mt-1" maxLength={300} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => postMutation.mutate()} disabled={!toUsername || !content.trim()} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Kirim 📣</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-32 animate-pulse" />)}</div>
      ) : shoutouts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p>Belum ada shoutout</p>
          <p className="text-sm mt-2">Jadilah yang pertama apresiasi member lain!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(shoutouts as any[]).map((s: any) => {
            const reactions = (s.reactions || {}) as Record<string, string[]>;
            const myName = user?.username || (guestName ? `Tamu_${guestName}` : null);
            return (
              <div key={s.id} className="glass rounded-2xl p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold glass px-2 py-1 rounded-full">@{s.fromUsername}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="text-xs font-bold text-primary glass px-2 py-1 rounded-full">@{s.toUsername} 📣</span>
                    </div>
                    <p className="text-sm leading-relaxed">{s.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</p>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => deleteMutation.mutate(s.id)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {REACTION_EMOJIS.map(emoji => {
                    const count = reactions[emoji]?.length || 0;
                    const reacted = myName ? reactions[emoji]?.includes(myName) : false;
                    return (
                      <button key={emoji} onClick={() => handleReact(s.id, emoji)} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${reacted ? 'bg-white/20 ring-1 ring-white/30' : 'bg-white/5 hover:bg-white/10'}`}>
                        {emoji}{count > 0 && <span>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
