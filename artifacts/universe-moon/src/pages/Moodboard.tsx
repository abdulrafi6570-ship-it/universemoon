import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Edit2, Trash2, SmilePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MOOD_EMOJIS = ['😊','🥰','😎','😴','😭','🤩','😤','🫠','🥹','🤗','😂','😔','🔥','🌙','✨','💜','🎵','🌊','🌸','💫'];
const MOOD_COLORS = [
  { label: 'Default', value: '#ffffff15', display: '#ffffff' },
  { label: 'Purple', value: '#7c3aed20', display: '#7c3aed' },
  { label: 'Blue', value: '#2563eb20', display: '#2563eb' },
  { label: 'Pink', value: '#ec489920', display: '#ec4899' },
  { label: 'Orange', value: '#f9731620', display: '#f97316' },
  { label: 'Green', value: '#16a34a20', display: '#16a34a' },
  { label: 'Yellow', value: '#eab30820', display: '#eab308' },
];

export default function Moodboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [mood, setMood] = useState('');
  const [emoji, setEmoji] = useState('😊');
  const [color, setColor] = useState('#ffffff15');

  const { data: moods = [], isLoading } = useQuery({
    queryKey: ['moods'],
    queryFn: () => fetch('/api/moods').then(r => r.json()),
    refetchInterval: 60000,
  });

  const saveMutation = useMutation({
    mutationFn: () => fetch('/api/moods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username, mood, emoji, color }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moods'] });
      setEditing(false);
      toast({ title: `${emoji} Mood diperbarui!` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (username: string) => fetch(`/api/moods/${username}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moods'] }),
  });

  const myMood = user ? (moods as any[]).find((m: any) => m.username === user.username) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow">💭 Moodboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Mood harian anggota Universe Moon</p>
        </div>
      </div>

      {/* Set My Mood */}
      {user && (
        <div className="glass rounded-2xl p-5 mb-6">
          {!editing && myMood ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: myMood.color || '#ffffff15' }}>
                  {myMood.emoji}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mood kamu</p>
                  <p className="font-semibold">{myMood.mood}</p>
                </div>
              </div>
              <button onClick={() => { setEditing(true); setMood(myMood.mood); setEmoji(myMood.emoji || '😊'); setColor(myMood.color || '#ffffff15'); }} className="p-2 glass hover:bg-white/10 rounded-xl transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold mb-3">{myMood ? 'Edit mood kamu' : 'Bagaimana mood kamu hari ini?'}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {MOOD_EMOJIS.map(e => (
                  <button key={e} onClick={() => setEmoji(e)} className={`text-xl p-1.5 rounded-xl transition-all ${emoji === e ? 'bg-white/20 scale-110' : 'hover:bg-white/10'}`}>{e}</button>
                ))}
              </div>
              <input value={mood} onChange={e => setMood(e.target.value)} placeholder="Describe your mood..." className="um-input w-full mb-3" maxLength={60} />
              <div className="flex gap-2 mb-3">
                {MOOD_COLORS.map(c => (
                  <button key={c.value} onClick={() => setColor(c.value)} title={c.label} className={`w-7 h-7 rounded-full border-2 transition-all ${color === c.value ? 'border-white scale-110' : 'border-white/20'}`} style={{ background: c.display }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveMutation.mutate()} disabled={!mood.trim()} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Simpan</button>
                {editing && <button onClick={() => setEditing(false)} className="px-4 text-sm text-muted-foreground hover:text-white">Batal</button>}
              </div>
            </div>
          )}
        </div>
      )}

      {!user && (
        <div className="glass rounded-2xl p-4 mb-6 text-center text-sm text-muted-foreground">
          Login untuk set mood kamu 😊
        </div>
      )}

      {/* All moods */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-28 animate-pulse" />)}</div>
      ) : moods.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <SmilePlus className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p>Belum ada yang set mood</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(moods as any[]).map((m: any) => (
            <div key={m.id} className="glass rounded-2xl p-4 group relative" style={{ background: m.color || '#ffffff10' }}>
              <div className="flex items-start justify-between mb-2">
                <div className="text-3xl">{m.emoji}</div>
                {(user?.username === m.username || user?.role === 'admin') && (
                  <button onClick={() => deleteMutation.mutate(m.username)} className="p-1.5 glass rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-sm font-medium line-clamp-2">{m.mood}</p>
              <p className="text-xs text-muted-foreground mt-2">@{m.username}</p>
              <p className="text-xs text-muted-foreground/60">{new Date(m.updatedAt).toLocaleDateString('id-ID')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
