import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState, useRef } from 'react';
import { Plus, Trash2, Clock, Image, Video, X, Upload } from 'lucide-react';
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
  const fileRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [color, setColor] = useState('#ffffff20');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => fetch('/api/stories').then(r => r.json()),
    refetchInterval: 60000,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      toast({ title: 'Hanya foto atau video yang didukung', variant: 'destructive' });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'File terlalu besar (max 20MB)', variant: 'destructive' });
      return;
    }
    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const postMutation = useMutation({
    mutationFn: async () => {
      let mediaUrl: string | null = null;
      let uploadedMediaType: string | null = null;

      if (mediaFile) {
        const fd = new FormData();
        fd.append('file', mediaFile);
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!upRes.ok) {
          const err = await upRes.json().catch(() => ({}));
          throw new Error(err.error || 'Upload file gagal');
        }
        const upData = await upRes.json();
        mediaUrl = upData.url;
        uploadedMediaType = mediaType;
      }

      const storyRes = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username,
          content: content || '',
          emoji,
          color,
          mediaUrl,
          mediaType: uploadedMediaType,
        }),
      });
      if (!storyRes.ok) {
        const err = await storyRes.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal membuat story');
      }
      return storyRes.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      setContent('');
      clearMedia();
      setShowForm(false);
      toast({ title: '📖 Story diposting!' });
    },
    onError: (err: any) => {
      toast({ title: err?.message || 'Gagal posting story', variant: 'destructive' });
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

  const canPost = content.trim() || mediaFile;

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
        <div className="glass rounded-2xl p-5 mb-6 space-y-4">
          <h2 className="font-bold">Story Baru (24 jam)</h2>

          {/* Emoji picker */}
          <div className="flex flex-wrap gap-2">
            {STORY_EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} className={`text-xl p-2 rounded-xl transition-all ${emoji === e ? 'bg-white/20 scale-110' : 'hover:bg-white/10'}`}>{e}</button>
            ))}
          </div>

          {/* Text input */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Apa yang mau kamu ceritakan hari ini?..."
            className="um-input w-full h-24 resize-none"
            maxLength={300}
          />

          {/* Media Upload */}
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
          {!mediaFile ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/20 hover:border-primary/50 rounded-xl text-sm text-muted-foreground hover:text-white transition-colors"
            >
              <Image className="w-4 h-4" />
              <Video className="w-4 h-4" />
              Tambah Foto / Video (opsional)
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black/30">
              {mediaType === 'image' ? (
                <img src={mediaPreview!} className="w-full max-h-48 object-contain rounded-xl" alt="preview" />
              ) : (
                <video src={mediaPreview!} className="w-full max-h-48 rounded-xl" controls />
              )}
              <button
                onClick={clearMedia}
                className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs">
                {mediaType === 'image' ? <Image className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                {mediaFile.name.slice(0, 20)}
              </div>
            </div>
          )}

          {/* Color picker */}
          <div className="flex gap-2">
            {STORY_COLORS.map(c => (
              <button key={c.value} onClick={() => setColor(c.value)} title={c.label}
                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.value ? 'border-white scale-110' : 'border-white/20'}`}
                style={{ background: c.value }} />
            ))}
          </div>

          {/* Preview */}
          <div className="rounded-xl p-4 text-center text-sm" style={{ background: color }}>
            <span className="text-2xl">{emoji}</span>
            {mediaPreview && mediaType === 'image' && (
              <img src={mediaPreview} className="w-full max-h-28 object-contain rounded-lg mt-2" alt="preview" />
            )}
            {mediaPreview && mediaType === 'video' && (
              <video src={mediaPreview} className="w-full max-h-28 rounded-lg mt-2" />
            )}
            <p className="mt-1 text-muted-foreground">{content || (mediaFile ? '' : 'Preview story...')}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => postMutation.mutate()}
              disabled={!canPost || postMutation.isPending}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {postMutation.isPending ? (
                <><Upload className="w-4 h-4 animate-bounce" /> {mediaFile ? 'Uploading...' : 'Posting...'}</>
              ) : 'Post Story'}
            </button>
            <button onClick={() => { setShowForm(false); clearMedia(); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-white">Batal</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : (stories as any[]).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">📖</p>
          <p className="text-lg">Belum ada story hari ini</p>
          <p className="text-sm mt-2">Jadilah yang pertama post story!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(stories as any[]).map((story: any) => (
            <div key={story.id}
              className="glass rounded-2xl overflow-hidden flex flex-col justify-between min-h-[160px] relative group"
              style={{ background: story.color || '#ffffff10' }}
            >
              {/* Media display */}
              {story.mediaUrl && story.mediaType === 'image' && (
                <img src={story.mediaUrl} alt="story" className="w-full h-36 object-cover" />
              )}
              {story.mediaUrl && story.mediaType === 'video' && (
                <video src={story.mediaUrl} className="w-full h-36 object-cover" controls />
              )}

              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <div className="text-2xl mb-1">{story.emoji}</div>
                  {story.content && <p className="text-sm leading-relaxed line-clamp-3">{story.content}</p>}
                </div>
                <div className="mt-2">
                  <p className="text-xs font-semibold">@{story.username}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Habis dalam {timeLeft(story.expiresAt)}
                  </p>
                </div>
              </div>

              {(user?.username === story.username || user?.role === 'admin') && (
                <button
                  onClick={() => { if (confirm('Hapus story ini?')) deleteMutation.mutate(story.id); }}
                  className="absolute top-3 right-3 p-1.5 bg-black/50 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-black/80 transition-all"
                >
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
