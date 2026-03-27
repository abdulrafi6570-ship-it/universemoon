import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, ImageIcon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const REACTION_EMOJIS = ['😂', '💀', '🔥', '👏', '😭', '🤣', '✨', '❤️'];

export default function Meme() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [guestName, setGuestName] = useState(() => localStorage.getItem('um_guest_name') || '');

  const { data: memes = [], isLoading } = useQuery({
    queryKey: ['memes'],
    queryFn: () => fetch('/api/memes').then(r => r.json()),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setFileUrl(data.url || '');
    setUploading(false);
  };

  const postMutation = useMutation({
    mutationFn: () => fetch('/api/memes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl, caption, uploadedBy: user?.username }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memes'] });
      setFileUrl(''); setCaption(''); setShowForm(false);
      toast({ title: '😂 Meme diposting!' });
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({ id, emoji, username }: { id: number; emoji: string; username: string }) => fetch(`/api/memes/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, emoji }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/memes/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memes'] }),
  });

  const handleReact = (id: number, emoji: string) => {
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
    reactMutation.mutate({ id, emoji, username });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow">😂 Meme Board</h1>
          <p className="text-muted-foreground text-sm mt-1">Koleksi meme lucu komunitas UM</p>
        </div>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Upload Meme
          </button>
        )}
      </div>

      {!user && (
        <div className="glass rounded-2xl p-4 mb-6 text-center text-sm text-muted-foreground">
          Login untuk upload meme kamu sendiri 😂
        </div>
      )}

      {showForm && user && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Upload Meme</h2>
          <div className="space-y-3">
            <label className="block">
              <div className={`border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-colors ${fileUrl ? 'border-white/40' : ''}`}>
                {fileUrl ? (
                  <img src={fileUrl} alt="preview" className="max-h-48 mx-auto rounded-xl object-contain" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Klik untuk upload meme'}</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption meme (opsional)..." className="um-input w-full" />
            <div className="flex gap-2">
              <button onClick={() => postMutation.mutate()} disabled={!fileUrl} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Post Meme 😂</button>
              <button onClick={() => { setShowForm(false); setFileUrl(''); setCaption(''); }} className="px-4 text-sm text-muted-foreground hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="columns-2 gap-4 space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl w-full h-48 animate-pulse" style={{ breakInside: 'avoid', marginBottom: '1rem' }} />)}
        </div>
      ) : memes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">😂</p>
          <p>Belum ada meme. Upload yang pertama!</p>
        </div>
      ) : (
        <div className="columns-2 gap-4">
          {(memes as any[]).map((meme: any) => {
            const reactions = (meme.reactions || {}) as Record<string, string[]>;
            const myName = user?.username || (guestName ? `Tamu_${guestName}` : null);
            return (
              <div key={meme.id} className="glass rounded-2xl overflow-hidden group mb-4" style={{ breakInside: 'avoid' }}>
                <div className="relative">
                  <img src={meme.fileUrl} alt={meme.caption || 'meme'} className="w-full object-cover" />
                  {(user?.username === meme.uploadedBy || user?.role === 'admin') && (
                    <button onClick={() => deleteMutation.mutate(meme.id)} className="absolute top-2 right-2 p-1.5 glass rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {meme.caption && <p className="text-xs p-3 text-muted-foreground">{meme.caption}</p>}
                <div className="px-3 pb-3">
                  <p className="text-xs text-muted-foreground/60 mb-2">@{meme.uploadedBy || 'anonim'}</p>
                  <div className="flex flex-wrap gap-1">
                    {REACTION_EMOJIS.map(emoji => {
                      const count = reactions[emoji]?.length || 0;
                      const reacted = myName ? reactions[emoji]?.includes(myName) : false;
                      return (
                        <button key={emoji} onClick={() => handleReact(meme.id, emoji)} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all ${reacted ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}>
                          {emoji}{count > 0 && <span>{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
