import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Plus, Upload, Swords, Medal, ChevronLeft, Download, Lock, Video as VideoIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Match = {
  id: number;
  round: number;
  matchIndex: number;
  name1: string | null;
  name2: string | null;
  winnerName: string | null;
  submission1Url?: string | null;
  submission2Url?: string | null;
  resultVideoUrl: string | null;
};

type BattleDetail = {
  id: number;
  title: string;
  isTeam: boolean;
  status: string;
  thirdPlace: string | null;
  matches: Match[];
};

async function uploadVideoToR2(file: File): Promise<string | null> {
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

function SideRow({ name, isWinner, canSubmit, canSetWinner, submissionUrl, isAdmin, onSetWinner, onSubmit }: {
  name: string | null; isWinner: boolean; canSubmit: boolean; canSetWinner: boolean;
  submissionUrl?: string | null; isAdmin: boolean;
  onSetWinner: () => void; onSubmit: (file: File) => void;
}) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 text-sm ${isWinner ? 'bg-yellow-500/20 text-yellow-300 font-semibold' : 'bg-white/5'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{name || '—'}</span>
        <div className="flex items-center gap-2 shrink-0">
          {name && canSetWinner && (
            <button onClick={onSetWinner} className="text-[10px] text-primary hover:underline">Menang</button>
          )}
        </div>
      </div>
      {name && canSubmit && (
        <label className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white cursor-pointer mt-1">
          <Upload className="w-3 h-3" /> Upload video timmu
          <input type="file" accept="video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onSubmit(f); }} />
        </label>
      )}
      {isAdmin && submissionUrl && (
        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
          <Lock className="w-3 h-3" /> Submission masuk
          <a href={submissionUrl} download target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
            <Download className="w-3 h-3" /> Unduh
          </a>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, isAdmin, canSubmitVideo, onSetWinner, onSubmitVideo, onSetResultVideo }: {
  match: Match; isAdmin: boolean; canSubmitVideo: boolean;
  onSetWinner: (matchId: number, name: string) => void;
  onSubmitVideo: (matchId: number, slot: 1 | 2, file: File) => void;
  onSetResultVideo: (matchId: number, file: File) => void;
}) {
  const decided = !!match.winnerName;
  const bothPresent = !!match.name1 && !!match.name2;
  return (
    <div className="glass rounded-xl p-3 min-w-[180px] space-y-1.5">
      <SideRow name={match.name1} isWinner={match.winnerName === match.name1}
        canSubmit={canSubmitVideo && bothPresent && !decided} canSetWinner={isAdmin && bothPresent && !decided}
        submissionUrl={match.submission1Url} isAdmin={isAdmin}
        onSetWinner={() => match.name1 && onSetWinner(match.id, match.name1)}
        onSubmit={f => onSubmitVideo(match.id, 1, f)} />
      <SideRow name={match.name2} isWinner={match.winnerName === match.name2}
        canSubmit={canSubmitVideo && bothPresent && !decided} canSetWinner={isAdmin && bothPresent && !decided}
        submissionUrl={match.submission2Url} isAdmin={isAdmin}
        onSetWinner={() => match.name2 && onSetWinner(match.id, match.name2)}
        onSubmit={f => onSubmitVideo(match.id, 2, f)} />
      {isAdmin && bothPresent && (
        <label className="flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer pt-1 border-t border-white/10">
          <VideoIcon className="w-3 h-3" /> {match.resultVideoUrl ? 'Ganti video hasil' : 'Upload video hasil (publik)'}
          <input type="file" accept="video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onSetResultVideo(match.id, f); }} />
        </label>
      )}
    </div>
  );
}

function BattleDetailPage({ id }: { id: number }) {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === 'admin';
  const canSubmitVideo = !!user && !isGuest;

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

  const submitVideo = async (matchId: number, slot: 1 | 2, file: File) => {
    toast({ title: 'Mengunggah video...' });
    const url = await uploadVideoToR2(file);
    if (!url) return toast({ title: 'Upload gagal', variant: 'destructive' });
    await fetch(`/api/battles/${id}/matches/${matchId}/submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot, url }),
    });
    refetch();
    toast({ title: 'Video terkirim ke admin!' });
  };

  const setResultVideo = async (matchId: number, file: File) => {
    toast({ title: 'Mengunggah video hasil...' });
    const url = await uploadVideoToR2(file);
    if (!url) return toast({ title: 'Upload gagal', variant: 'destructive' });
    await fetch(`/api/battles/${id}/matches/${matchId}/result`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultVideoUrl: url }),
    });
    refetch();
    toast({ title: 'Video hasil dipublikasikan!' });
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

  const half = (arr: Match[], side: 'left' | 'right') => {
    const mid = Math.ceil(arr.length / 2);
    return side === 'left' ? arr.slice(0, mid) : arr.slice(mid);
  };
  const earlyRounds = matchesByRound.slice(0, rounds - 1);

  const renderMatch = (m: Match) => (
    <MatchCard key={m.id} match={m} isAdmin={isAdmin} canSubmitVideo={canSubmitVideo}
      onSetWinner={setWinner} onSubmitVideo={submitVideo} onSetResultVideo={setResultVideo} />
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <button onClick={() => setLocation('/battle')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white">
        <ChevronLeft className="w-4 h-4" /> Semua Battle
      </button>

      <div>
        <h2 className="font-serif text-2xl font-bold flex items-center gap-2"><Swords className="w-6 h-6" /> {battle.title}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">{battle.isTeam ? 'Battle Tim' : 'Battle 1v1'} — {battle.status === 'finished' ? 'Selesai' : 'Berlangsung'}</p>
      </div>

      {/* Bracket — split left/right around a centered final so it doesn't hug the left edge */}
      <div className="glass rounded-2xl p-4 overflow-x-auto">
        <div className="flex gap-3 items-center justify-center min-w-max mx-auto">
          {earlyRounds.length > 0 ? (
            <>
              <div className="flex gap-3">
                {earlyRounds.map((roundMatches, r) => (
                  <div key={`l${r}`} className="flex flex-col gap-4 justify-around">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                      {r === rounds - 2 ? 'Semifinal' : `Ronde ${r + 1}`}
                    </p>
                    {half(roundMatches, 'left').map(renderMatch)}
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-2 px-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Final</p>
                {finalMatch && renderMatch(finalMatch)}
                {champion && (
                  <div className="flex flex-col items-center gap-1 pt-2">
                    <Trophy className="w-9 h-9 text-yellow-400" />
                    <p className="text-xs font-bold text-yellow-300">{champion}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 flex-row-reverse">
                {earlyRounds.map((roundMatches, r) => (
                  <div key={`r${r}`} className="flex flex-col gap-4 justify-around">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                      {r === rounds - 2 ? 'Semifinal' : `Ronde ${r + 1}`}
                    </p>
                    {half(roundMatches, 'right').map(renderMatch)}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {finalMatch && renderMatch(finalMatch)}
              {champion && (
                <div className="flex flex-col items-center gap-1 pt-2">
                  <Trophy className="w-9 h-9 text-yellow-400" />
                  <p className="text-xs font-bold text-yellow-300">{champion}</p>
                </div>
              )}
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

      {/* Public official result videos — everyone can watch & download these */}
      {battle.matches.some(m => m.resultVideoUrl) && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-bold mb-4">🎥 Video Hasil Pertandingan</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {battle.matches.filter(m => m.resultVideoUrl).map(m => (
              <div key={m.id}>
                <video src={m.resultVideoUrl!} controls className="w-full rounded-xl bg-black aspect-video" />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{m.name1 || '?'} vs {m.name2 || '?'}</p>
                  <a href={m.resultVideoUrl!} download target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Download className="w-3 h-3" /> Unduh
                  </a>
                </div>
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
