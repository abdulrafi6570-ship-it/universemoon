import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Plus, Upload, Swords, Medal, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Match = {
  id: number;
  round: number;
  matchIndex: number;
  name1: string | null;
  name2: string | null;
  winnerName: string | null;
  videoUrl: string | null;
};

type BattleDetail = {
  id: number;
  title: string;
  isTeam: boolean;
  status: string;
  thirdPlace: string | null;
  matches: Match[];
};

async function uploadMatchVideo(file: File): Promise<string | null> {
  const presignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type, type: 'video' }),
  });
  if (!presignRes.ok) return null;
  const { uploadUrl, url } = await presignRes.json();
  const putRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  return putRes.ok ? url : null;
}

function BattleList() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isTeam, setIsTeam] = useState(false);
  const [namesText, setNamesText] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: battles = [] } = useQuery({
    queryKey: ['battles'],
    queryFn: () => fetch('/api/battles').then(r => r.json()),
  });

  const createBattle = async () => {
    const names = namesText.split('\n').map(n => n.trim()).filter(Boolean);
    if (!title.trim() || names.length < 2) {
      return toast({ title: 'Isi judul & minimal 2 peserta (1 nama per baris)', variant: 'destructive' });
    }
    setCreating(true);
    try {
      const res = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, isTeam, names }),
      });
      if (!res.ok) throw new Error();
      const battle = await res.json();
      qc.invalidateQueries({ queryKey: ['battles'] });
      setOpen(false);
      setTitle(''); setNamesText(''); setIsTeam(false);
      setLocation(`/battle/${battle.id}`);
    } catch {
      toast({ title: 'Gagal membuat battle', variant: 'destructive' });
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2"><Swords className="w-6 h-6" /> Battle</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Turnamen bracket Universe Moon — event tiap 3 bulan</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors">
                <Plus className="w-4 h-4" /> Buat Battle
              </button>
            </DialogTrigger>
            <DialogContent className="glass border border-white/20 max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Buat Battle Baru</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul battle*"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={isTeam} onChange={e => setIsTeam(e.target.checked)} />
                  Ini battle tim (bukan 1v1 perorangan)
                </label>
                <textarea value={namesText} onChange={e => setNamesText(e.target.value)} rows={6}
                  placeholder={isTeam ? 'Nama tim, 1 per baris...' : 'Nama peserta, 1 per baris...'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none" />
                <p className="text-xs text-muted-foreground">Minimal 2 peserta. Kalau jumlahnya bukan 2/4/8/16, sebagian otomatis dapat "bye" (langsung lolos ronde 1).</p>
                <button onClick={createBattle} disabled={creating}
                  className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 rounded-xl font-semibold disabled:opacity-50">
                  {creating ? 'Membuat bracket...' : 'Buat Bracket'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {battles.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada battle. {isAdmin ? 'Buat yang pertama!' : 'Tunggu event dari admin ya.'}</p>
          </div>
        )}
        {battles.map((b: any) => (
          <button key={b.id} onClick={() => setLocation(`/battle/${b.id}`)}
            className="glass rounded-2xl p-4 flex items-center justify-between text-left hover:border-white/20 border border-transparent transition-all">
            <div>
              <h3 className="font-semibold">{b.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{b.isTeam ? 'Battle Tim' : 'Battle 1v1'}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${b.status === 'finished' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-primary/20 text-primary'}`}>
              {b.status === 'finished' ? 'Selesai' : 'Berlangsung'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, isTeam, canEdit, onSetWinner, onUploadVideo }: {
  match: Match; isTeam: boolean; canEdit: boolean;
  onSetWinner: (matchId: number, name: string) => void;
  onUploadVideo: (matchId: number, file: File) => void;
}) {
  const label = isTeam ? 'Tim' : 'Peserta';
  const empty = !match.name1 && !match.name2;
  return (
    <div className="glass rounded-xl p-3 min-w-[180px] space-y-1.5">
      {[match.name1, match.name2].map((name, idx) => (
        <div key={idx}
          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm ${
            name && match.winnerName === name ? 'bg-yellow-500/20 text-yellow-300 font-semibold' : 'bg-white/5'
          }`}>
          <span className="truncate">{name || (empty ? `${label} ?` : '—')}</span>
          {canEdit && name && !match.winnerName && (
            <button onClick={() => onSetWinner(match.id, name)} className="text-[10px] text-primary hover:underline shrink-0 ml-2">
              Menang
            </button>
          )}
        </div>
      ))}
      {canEdit && (
        <label className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white cursor-pointer pt-1">
          <Upload className="w-3 h-3" />
          {match.videoUrl ? 'Ganti video' : 'Upload video pertandingan'}
          <input type="file" accept="video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onUploadVideo(match.id, f); }} />
        </label>
      )}
      {match.videoUrl && (
        <video src={match.videoUrl} controls className="w-full rounded-lg mt-1 bg-black" />
      )}
    </div>
  );
}

function BattleDetailPage({ id }: { id: number }) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === 'admin';

  const { data: battle, refetch } = useQuery<BattleDetail>({
    queryKey: ['battle', id],
    queryFn: () => fetch(`/api/battles/${id}`).then(r => r.json()),
  });

  const setWinner = async (matchId: number, winnerName: string) => {
    await fetch(`/api/battles/${id}/matches/${matchId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerName }),
    });
    refetch();
  };

  const uploadVideo = async (matchId: number, file: File) => {
    toast({ title: 'Mengunggah video...' });
    const url = await uploadMatchVideo(file);
    if (!url) return toast({ title: 'Upload gagal', variant: 'destructive' });
    await fetch(`/api/battles/${id}/matches/${matchId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: url }),
    });
    refetch();
    toast({ title: 'Video pertandingan tersimpan!' });
  };

  const setThirdPlace = async (name: string) => {
    await fetch(`/api/battles/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thirdPlace: name }),
    });
    refetch();
  };

  if (!battle) return <div className="text-center text-muted-foreground py-12">Loading...</div>;

  const rounds = Math.max(...battle.matches.map(m => m.round)) + 1;
  const matchesByRound: Match[][] = Array.from({ length: rounds }, (_, r) => battle.matches.filter(m => m.round === r));
  const finalMatch = matchesByRound[rounds - 1]?.[0];
  const champion = finalMatch?.winnerName || null;
  const runnerUp = finalMatch ? (finalMatch.winnerName === finalMatch.name1 ? finalMatch.name2 : finalMatch.name1) : null;
  const semifinalLosers = rounds >= 2
    ? matchesByRound[rounds - 2].map(m => (m.winnerName ? (m.winnerName === m.name1 ? m.name2 : m.name1) : null)).filter(Boolean) as string[]
    : [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <button onClick={() => setLocation('/battle')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white">
        <ChevronLeft className="w-4 h-4" /> Semua Battle
      </button>

      <div>
        <h2 className="font-serif text-2xl font-bold flex items-center gap-2"><Swords className="w-6 h-6" /> {battle.title}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">{battle.isTeam ? 'Battle Tim' : 'Battle 1v1'} — {battle.status === 'finished' ? 'Selesai' : 'Berlangsung'}</p>
      </div>

      {/* Bracket */}
      <div className="glass rounded-2xl p-4 overflow-x-auto">
        <div className="flex gap-6 items-center min-w-max">
          {matchesByRound.map((roundMatches, r) => (
            <div key={r} className="flex flex-col gap-6 justify-around">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                {r === rounds - 1 ? 'Final' : r === rounds - 2 ? 'Semifinal' : `Ronde ${r + 1}`}
              </p>
              {roundMatches.map(m => (
                <MatchCard key={m.id} match={m} isTeam={battle.isTeam} canEdit={isAdmin && !m.winnerName}
                  onSetWinner={setWinner} onUploadVideo={uploadVideo} />
              ))}
            </div>
          ))}
          {champion && (
            <div className="flex flex-col items-center justify-center gap-2 pl-2">
              <Trophy className="w-10 h-10 text-yellow-400" />
              <p className="text-sm font-bold text-yellow-300">{champion}</p>
            </div>
          )}
        </div>
      </div>

      {/* Podium */}
      {champion && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Medal className="w-4 h-4 text-yellow-400" /> Juara</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">🥇 Juara 1</p>
              <p className="font-semibold text-sm">{champion}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">🥈 Juara 2</p>
              <p className="font-semibold text-sm">{runnerUp || '—'}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">🥉 Juara 3</p>
              {battle.thirdPlace ? (
                <p className="font-semibold text-sm">{battle.thirdPlace}</p>
              ) : isAdmin && semifinalLosers.length > 0 ? (
                <div className="flex flex-col gap-1 mt-1">
                  {semifinalLosers.map(name => (
                    <button key={name} onClick={() => setThirdPlace(name)} className="text-xs text-primary hover:underline">{name}</button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Match video recaps */}
      {battle.matches.some(m => m.videoUrl) && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-bold mb-4">🎥 Video Pertandingan</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {battle.matches.filter(m => m.videoUrl).map(m => (
              <div key={m.id}>
                <video src={m.videoUrl!} controls className="w-full rounded-xl bg-black aspect-video" />
                <p className="text-xs text-muted-foreground mt-1">{m.name1 || '?'} vs {m.name2 || '?'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Battle() {
  const params = useParams<{ id?: string }>();
  if (params.id) return <BattleDetailPage id={parseInt(params.id)} />;
  return <BattleList />;
}
