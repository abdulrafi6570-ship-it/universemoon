import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, Heart, Eye, BookOpen, ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GENRES = ['General', 'Romance', 'Komedi', 'Drama', 'Thriller', 'Fantasy', 'Slice of Life'];

export default function Fanfic() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [reading, setReading] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [genre, setGenre] = useState('General');
  const [activeGenre, setActiveGenre] = useState('Semua');

  const { data: fanfics = [], isLoading } = useQuery({
    queryKey: ['fanfics'],
    queryFn: () => fetch('/api/fanfics').then(r => r.json()),
  });

  const postMutation = useMutation({
    mutationFn: () => fetch('/api/fanfics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, genre, authorUsername: user?.username }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fanfics'] });
      setTitle(''); setContent(''); setGenre('General'); setShowForm(false);
      toast({ title: '✍️ Cerita diposting!' });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/fanfics/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fanfics'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/fanfics/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fanfics'] }); setReading(null); },
  });

  const openFanfic = (fic: any) => {
    fetch(`/api/fanfics/${fic.id}`).then(r => r.json()).then(() => qc.invalidateQueries({ queryKey: ['fanfics'] }));
    setReading(fic);
  };

  const genres = ['Semua', ...GENRES];
  const filtered = activeGenre === 'Semua' ? fanfics : (fanfics as any[]).filter((f: any) => f.genre === activeGenre);

  if (reading) {
    const likes = (reading.likes as string[]) || [];
    const liked = user ? likes.includes(user.username) : false;
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => setReading(null)} className="flex items-center gap-2 text-muted-foreground hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-xs glass px-2 py-1 rounded-full text-muted-foreground mb-2 inline-block">{reading.genre}</span>
              <h1 className="font-serif text-2xl font-bold">{reading.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">oleh @{reading.authorUsername}</p>
            </div>
            {(user?.username === reading.authorUsername || user?.role === 'admin') && (
              <button onClick={() => deleteMutation.mutate(reading.id)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-sm leading-loose whitespace-pre-wrap text-white/80">{reading.content}</p>
          </div>
          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/10">
            <button onClick={() => user && likeMutation.mutate(reading.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${liked ? 'bg-pink-500/20 text-pink-400 ring-1 ring-pink-400/30' : 'glass hover:bg-white/10 text-muted-foreground'} ${!user ? 'opacity-50 cursor-default' : ''}`}>
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> {likes.length}
            </button>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" /> {reading.views || 0} views
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow">✍️ Cerita & Fanfic</h1>
          <p className="text-muted-foreground text-sm mt-1">Karya tulis anggota Universe Moon</p>
        </div>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Tulis
          </button>
        )}
      </div>

      {!user && (
        <div className="glass rounded-2xl p-4 mb-6 text-center text-sm text-muted-foreground">
          Login untuk menulis cerita kamu sendiri ✍️
        </div>
      )}

      {showForm && user && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Tulis Cerita</h2>
          <div className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul cerita..." className="um-input w-full" />
            <select value={genre} onChange={e => setGenre(e.target.value)} className="um-input w-full">
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Mulai ceritamu di sini..." className="um-input w-full h-48 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => postMutation.mutate()} disabled={!title || !content} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Publish ✍️</button>
              <button onClick={() => setShowForm(false)} className="px-4 text-sm text-muted-foreground hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
        {genres.map(g => (
          <button key={g} onClick={() => setActiveGenre(g)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeGenre === g ? 'bg-white/20 text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>{g}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-28 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p>Belum ada cerita</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(filtered as any[]).map((fic: any) => {
            const likes = (fic.likes as string[]) || [];
            const liked = user ? likes.includes(user.username) : false;
            return (
              <div key={fic.id} className="glass rounded-2xl p-5 group cursor-pointer hover:bg-white/5 transition-colors" onClick={() => openFanfic(fic)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs glass px-2 py-0.5 rounded-full text-muted-foreground">{fic.genre}</span>
                    </div>
                    <h3 className="font-bold mb-1">{fic.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{fic.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">oleh @{fic.authorUsername}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => user && likeMutation.mutate(fic.id)} className={`flex items-center gap-1 text-sm transition-colors ${liked ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400'} ${!user ? 'cursor-default' : ''}`}>
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> {likes.length}
                  </button>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="w-3 h-3" /> {fic.views || 0}</span>
                  <span className="text-xs text-muted-foreground ml-auto">Baca selengkapnya →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
