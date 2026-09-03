import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Star, MessageCircle, Image, Award, Flame, Clock, Calendar, Music, Edit2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const params = useParams<{ username: string }>();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const username = params.username || user?.username;
  const [editingMood, setEditingMood] = useState(false);
  const [moodText, setMoodText] = useState('');
  const [moodEmoji, setMoodEmoji] = useState('😊');
  const [editingInfo, setEditingInfo] = useState(false);
  const [nicknameEdit, setNicknameEdit] = useState('');
  const [bioEdit, setBioEdit] = useState('');
  const [songEdit, setSongEdit] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const MOOD_EMOJIS = ['😊','🌙','⭐','🔥','💫','😴','🎵','💜','🌊','✨','😂','❤️','🌸','💪','🎉'];

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetch(`/api/profile/${username}`).then(r => r.json()),
    enabled: !!username,
  });

  const isOwn = user?.username === username;

  const saveMood = async () => {
    if (!moodText.trim()) return;
    await fetch('/api/moods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username, mood: moodText, emoji: moodEmoji }),
    });
    refetch();
    setEditingMood(false);
    toast({ title: 'Mood updated!' });
  };

  const startEditInfo = () => {
    setNicknameEdit(profile?.member?.nickname || '');
    setBioEdit(profile?.member?.bio || '');
    setSongEdit(profile?.member?.favoriteSong || '');
    setAvatarPreview(null);
    setAvatarFile(null);
    setEditingInfo(true);
  };

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveInfo = async () => {
    setIsSavingInfo(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await fetch('/api/upload/avatar', { method: 'POST', body: formData }).then(r => r.json());
        avatarUrl = uploadRes.url;
      }
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nicknameEdit, bio: bioEdit, favoriteSong: songEdit, avatarUrl }),
      });
      await refetch();
      setEditingInfo(false);
      toast({ title: 'Profil disimpan!' });
    } catch {
      toast({ title: 'Gagal menyimpan', variant: 'destructive' });
    }
    setIsSavingInfo(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse mx-auto mb-4" />
        <p className="text-muted-foreground">Loading profil...</p>
      </div>
    </div>
  );

  if (!profile || profile.error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-6xl mb-4">🌙</p>
        <p className="text-muted-foreground">Profil tidak ditemukan</p>
      </div>
    </div>
  );

  const levelColors = ['text-gray-400', 'text-blue-400', 'text-purple-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
  const levelColor = levelColors[Math.min(Math.floor((profile.level || 1) / 5), 5)] || 'text-white';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Hero Card */}
      <div className="glass rounded-2xl p-6 mb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        <div className="relative">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.username} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-white/20 shadow-2xl" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 text-3xl font-bold ring-4 ring-white/20">
              {profile.username?.substring(0, 2).toUpperCase()}
            </div>
          )}

          <h1 className="text-2xl font-bold text-glow mb-1">@{profile.username}</h1>
          <p className="text-sm text-muted-foreground capitalize mb-3">{profile.role}</p>

          {/* Mood */}
          {profile.mood && !editingMood && (
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm mb-3">
              <span>{profile.mood.emoji || '😊'}</span>
              <span className="text-muted-foreground">{profile.mood.mood}</span>
              {isOwn && (
                <button onClick={() => { setEditingMood(true); setMoodText(profile.mood.mood); setMoodEmoji(profile.mood.emoji || '😊'); }} className="text-white/40 hover:text-white transition-colors">
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {isOwn && (editingMood || !profile.mood) && (
            <div className="glass rounded-xl p-3 mb-3 text-left">
              <p className="text-xs text-muted-foreground mb-2">Set mood kamu:</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {MOOD_EMOJIS.map(e => (
                  <button key={e} onClick={() => setMoodEmoji(e)} className={`text-xl p-1 rounded-lg transition-all ${moodEmoji === e ? 'bg-white/20 scale-110' : 'hover:bg-white/10'}`}>{e}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={moodText} onChange={e => setMoodText(e.target.value)} placeholder="Mood hari ini..." className="um-input flex-1 text-sm" onKeyDown={e => e.key === 'Enter' && saveMood()} />
                <button onClick={saveMood} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><Check className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {isOwn && !editingMood && !profile.mood && (
            <button onClick={() => setEditingMood(true)} className="text-xs text-muted-foreground hover:text-white transition-colors mb-3 block mx-auto">+ Set mood kamu</button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="glass rounded-xl p-3">
            <div className={`text-xl font-bold ${levelColor}`}>Lv{profile.level || 1}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-xl font-bold text-yellow-400">{profile.xp || 0}</div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-xl font-bold text-orange-400">{profile.streak || 0}</div>
            <div className="text-xs text-muted-foreground">Streak 🔥</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-xl font-bold">{profile.photoCount || 0}</div>
            <div className="text-xs text-muted-foreground">Foto</div>
          </div>
        </div>
      </div>

      {/* Member Info */}
      {profile.member && !editingInfo && (
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> Info Anggota</h2>
            {isOwn && (
              <button onClick={startEditInfo} className="text-white/40 hover:text-white transition-colors">
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="space-y-3 text-sm">
            {profile.member.nickname && (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-24">Nickname</span>
                <span className="font-medium">{profile.member.nickname}</span>
              </div>
            )}
            {profile.member.role && (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-24">Role</span>
                <span className="font-medium">{profile.member.role}</span>
              </div>
            )}
            {profile.member.bio && (
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground w-24">Bio</span>
                <span className="font-medium">{profile.member.bio}</span>
              </div>
            )}
            {profile.member.joinDate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Bergabung {profile.member.joinDate}</span>
              </div>
            )}
            {profile.member.specialty && (
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{profile.member.specialty}</span>
              </div>
            )}
            {profile.member.favoriteSong && (
              <div className="flex items-center gap-3">
                <Music className="w-4 h-4 text-purple-400" />
                <span className="italic">"{profile.member.favoriteSong}"</span>
              </div>
            )}
          </div>
        </div>
      )}

      {isOwn && !profile.member && !editingInfo && (
        <div className="glass rounded-2xl p-5 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">Kamu belum lengkapi info profil.</p>
          <button onClick={startEditInfo} className="text-sm text-primary hover:underline">+ Lengkapi info anggota</button>
        </div>
      )}

      {isOwn && editingInfo && (
        <div className="glass rounded-2xl p-5 mb-6 space-y-3 text-left">
          <h2 className="font-bold mb-1 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> Edit Info Anggota</h2>
          <div className="flex flex-col items-center gap-2">
            <label htmlFor="avatar-pick-profile" className="cursor-pointer">
              {avatarPreview ? (
                <img src={avatarPreview} alt="preview" className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20" />
              ) : profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="current" className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-xs text-muted-foreground text-center ring-2 ring-white/10">
                  Pilih<br/>Foto
                </div>
              )}
            </label>
            <input id="avatar-pick-profile" type="file" accept="image/*" onChange={handleAvatarPick} className="hidden" />
            <label htmlFor="avatar-pick-profile" className="text-xs text-primary hover:underline cursor-pointer">Ambil dari galeri</label>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nickname</label>
            <input value={nicknameEdit} onChange={e => setNicknameEdit(e.target.value)} className="um-input w-full text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
            <textarea value={bioEdit} onChange={e => setBioEdit(e.target.value)} rows={3} className="um-input w-full text-sm resize-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Lagu favorit</label>
            <input value={songEdit} onChange={e => setSongEdit(e.target.value)} className="um-input w-full text-sm" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={saveInfo} disabled={isSavingInfo} className="flex-1 bg-white text-black font-semibold rounded-xl py-2 text-sm hover:bg-gray-200 transition-colors">
              {isSavingInfo ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button onClick={() => setEditingInfo(false)} className="flex-1 text-sm text-muted-foreground hover:text-white rounded-xl py-2">Batal</button>
          </div>
        </div>
      )}

      {/* Birthday */}
      {profile.birthday && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-3 flex items-center gap-2">🎂 Ulang Tahun</h2>
          <p className="text-muted-foreground">{profile.birthday.birthDate}</p>
        </div>
      )}


      {/* Shoutouts Received */}
      {profile.shoutoutsReceived?.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">📣 Shoutout Untukku</h2>
          <div className="space-y-3">
            {profile.shoutoutsReceived.map((s: any) => (
              <div key={s.id} className="glass rounded-xl p-3 text-sm">
                <p className="font-medium text-primary mb-1">Dari @{s.fromUsername}</p>
                <p className="text-muted-foreground">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Seen */}
      {profile.lastSeen && (
        <div className="text-center text-xs text-muted-foreground">
          <Clock className="w-3 h-3 inline mr-1" />
          Terakhir online: {new Date(profile.lastSeen).toLocaleString('id-ID')}
        </div>
      )}
    </div>
  );
}
