import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, Music2, Heart, ExternalLink, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Playlist() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [guestName, setGuestName] = useState(() => localStorage.getItem('um_guest_name') || '');

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['playlist-votes'],
    queryFn: () => fetch('/api/playlist-votes').then(r => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: () => fetch('/api/playlist-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist, youtubeUrl, addedBy: user?.username }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlist-votes'] });
      setTitle(''); setArtist(''); setYoutubeUrl(''); setShowForm(false);
      toast({ title: '🎵 Lagu ditambahkan!' });
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, username }: { id: number; username: string }) => fetch(`/api/playlist-votes/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlist-votes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/playlist-votes/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlist-votes'] }),
  });

  const handleVote = (song: any) => {
    let username = user?.username;
    if (!username) {
      let g = guestName;
      if (!g) {
        const name = prompt('Siapa namamu?');
        if (!name) return;
        g = name;
        localStorage.setItem('um_guest_name', g);
        setGuestName(g);
      }
      username = `Tamu_${g}`;
    }
    voteMutation.mutate({ id: song.id, username });
  };

  const sorted = [...(songs as any[])].sort((a, b) => ((b.votes as string[])?.length || 0) - ((a.votes as string[])?.length || 0));

  const getYoutubeId = (url: string) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow flex items-center gap-2"><Music2 className="w-7 h-7" /> Playlist Bersama</h1>
          <p className="text-muted-foreground text-sm mt-1">Vote lagu favoritmu untuk playlist UM!</p>
        </div>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Tambah Lagu
          </button>
        )}
      </div>

      {showForm && user && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Tambah Lagu</h2>
          <div className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul lagu..." className="um-input w-full" />
            <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artis..." className="um-input w-full" />
            <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Link YouTube (opsional)..." className="um-input w-full" />
            <div className="flex gap-2">
              <button onClick={() => addMutation.mutate()} disabled={!title.trim()} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Tambahkan 🎵</button>
              <button onClick={() => setShowForm(false)} className="px-4 text-sm text-muted-foreground hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Music2 className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p>Belum ada lagu. Tambahkan lagu favoritmu!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((song: any, idx: number) => {
            const votes = (song.votes as string[]) || [];
            const myName = user?.username || (guestName ? `Tamu_${guestName}` : null);
            const voted = myName ? votes.includes(myName) : false;
            const ytId = getYoutubeId(song.youtubeUrl || '');
            return (
              <div key={song.id} className="glass rounded-2xl p-4 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground">{song.artist} {song.addedBy && `· oleh @${song.addedBy}`}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ytId && (
                    <a href={song.youtubeUrl} target="_blank" rel="noreferrer" className="p-2 glass hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => handleVote(song)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all ${voted ? 'bg-pink-500/20 text-pink-400 ring-1 ring-pink-400/30' : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white'}`}>
                    <Heart className={`w-4 h-4 ${voted ? 'fill-current' : ''}`} /> {votes.length}
                  </button>
                  {user?.role === 'admin' && (
                    <button onClick={() => deleteMutation.mutate(song.id)} className="p-2 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
