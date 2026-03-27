import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STORY_EMOJIS = ['✨', '🌙', '⭐', '💫', '🔥', '💜', '🌸', '🎵', '😊', '🌊', '🎉', '💭', '🌟', '🦋', '🌺'];
const STORY_COLORS = [
  { label: 'Default', value: '#ffffff20' },
  { label: 'Purple', value: '#7c3aed20' },
  { label: 'Blue', value: '#2563eb20' },
  { label: 'Pink', value: '#ec489920' },
  { label: 'Orange', value: '#f9731620' },
  { label: 'Green', value: '#16a34a20' },
];

export default function Story() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [color, setColor] = useState('#ffffff20');

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => fetch('/api/stories').then(r => r.json()),
    refetchInterval: 60000,
  });

  const postMutation = useMutation({
    mutationFn: () => fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username, content, emoji, color }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      setContent(''); setShowForm(false);
      toast({ title: '📖 Story diposting!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/stories/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hrs > 0) return `${hrs}j ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow">📖 Story Harian</h1>
          <p className="text-muted-foreground text-sm mt-1">Cerita & status 24 jam anggota UM</p>
        </div>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Post Story
          </button>
        )}
      </div>

      {!user && (
        <div className="glass rounded-2xl p-4 mb-6 text-center text-sm text-muted-foreground">
          Login untuk posting story kamu sendiri ✨
        </div>
      )}

      {showForm && user && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Story Baru (24 jam)</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {STORY_EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} className={`text-xl p-2 rounded-xl transition-all ${emoji === e ? 'bg-white/20 scale-110' : 'hover:bg-white/10'}`}>{e}</button>
            ))}
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Apa yang mau kamu ceritakan hari ini?..." className="um-input w-full h-24 resize-none mb-3" maxLength={300} />
          <div className="flex gap-2 mb-3">
            {STORY_COLORS.map(c => (
              <button key={c.value} onClick={() => setColor(c.value)} title={c.label} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.value ? 'border-white scale-110' : 'border-white/20'}`} style={{ background: c.value }} />
            ))}
          </div>
          {/* Preview */}
          <div className="rounded-xl p-4 mb-3 text-center text-sm" style={{ background: color }}>
            <span className="text-2xl">{emoji}</span>
            <p className="mt-1 text-muted-foreground">{content || 'Preview story...'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => postMutation.mutate()} disabled={!content.trim()} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Post Story</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-white">Batal</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">📖</p>
          <p className="text-lg">Belum ada story hari ini</p>
          <p className="text-sm mt-2">Jadilah yang pertama post story!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(stories as any[]).map((story: any) => (
            <div key={story.id} className="glass rounded-2xl p-5 flex flex-col justify-between min-h-[160px] relative group" style={{ background: story.color || '#ffffff10' }}>
              <div>
                <div className="text-3xl mb-2">{story.emoji}</div>
                <p className="text-sm leading-relaxed line-clamp-3">{story.content}</p>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold">@{story.username}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> Habis dalam {timeLeft(story.expiresAt)}
                </p>
              </div>
              {(user?.username === story.username || user?.role === 'admin') && (
                <button onClick={() => deleteMutation.mutate(story.id)} className="absolute top-3 right-3 p-1.5 glass rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
