import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Crown, Eye, EyeOff, ChevronRight, Vote, Trophy, RotateCcw, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/use-sound';

const API = (p: string) => `/api/games${p}`;

const ROLES_20 = [
  { name: 'Detektif', desc: 'Amati semua clue dengan teliti. Catat yang aneh!' },
  { name: 'Provokator', desc: 'Buat pemain lain saling curiga satu sama lain.' },
  { name: 'Diplomatis', desc: 'Tetap netral, dengarkan semua pihak sebelum vote.' },
  { name: 'Paranoid', desc: 'Curigai siapa saja — bahkan yang paling polos sekalipun.' },
  { name: 'Si Cerdik', desc: 'Berikan clue yang membingungkan agar Imposter kebingungan.' },
  { name: 'Bluffer', desc: 'Pura-pura tidak tahu, padahal kamu sudah tahu jawabannya.' },
  { name: 'Mata-Mata', desc: 'Perhatikan gerakan dan ekspresi pemain lain dengan cermat.' },
  { name: 'Si Bawel', desc: 'Terus bicara dan beri banyak clue agar Imposter terbongkar.' },
  { name: 'Pendiam', desc: 'Bicara minimal, amati maksimal. Simpan kesimpulanmu.' },
  { name: 'Penganalisa', desc: 'Analisis setiap clue secara logis dan sistematis.' },
  { name: 'Aktor', desc: 'Jika Imposter, pura-pura tidak tahu kata warga dengan meyakinkan!' },
  { name: 'Kamuflase', desc: 'Berbaur dengan grup agar tidak terlihat mencurigakan.' },
  { name: 'Manipulator', desc: 'Arahkan voting ke orang lain — berguna untuk Imposter!' },
  { name: 'Si Polos', desc: 'Jujur total dengan clue, percaya penuh pada teman-teman.' },
  { name: 'Spekulan', desc: 'Buat teori dan spekulasi berdasarkan semua clue yang ada.' },
  { name: 'Agen Rahasia', desc: 'Jaga identitas aslimu sampai saat-saat terakhir voting.' },
  { name: 'Pemimpin', desc: 'Kendalikan alur diskusi grup agar tetap terarah.' },
  { name: "Devil's Advocate", desc: 'Selalu bela yang tertuduh agar diskusi tetap fair.' },
  { name: 'Observator', desc: 'Diam tapi perhatikan semuanya. Suaramu sangat berharga.' },
  { name: 'Provokator Terselubung', desc: 'Tunjukkan kepercayaan ke semua orang, tapi tetap waspada.' },
];

interface Player { username: string; isImposter: boolean; word: string; role: string; eliminated: boolean; votes: number; hasGivenClue: boolean; }
interface Clue { username: string; clue: string; round: number; }
interface RoomData {
  id: number; code: string; gameType: string; hostUsername: string; status: string;
  phase: string; round: number; clueOrder: string[]; currentClueIdx: number;
  clues: Clue[]; votes: any[]; winner: string | null; players: Player[];
  settings: { mainWord?: string; imposterWord?: string; categoryName?: string };
}

export default function ImposterGame() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { playSfx } = useSound();

  const [screen, setScreen] = useState<'home'|'join'|'room'>('home');
  const [joinCode, setJoinCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<RoomData | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<Player | null>(null);
  const [showRole, setShowRole] = useState(false);
  const [clueInput, setClueInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLB, setShowLB] = useState(false);

  const username = user?.username || '';

  const shareToChat = async (code: string) => {
    if (!username) return;
    try {
      await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: username,
          content: `🎭 Yuk main Game Imposter bareng! Join pake kode: *${code}* → Games → Imposter → Join Room`,
        }),
      });
      toast({ title: '✅ Kode sudah dikirim ke group chat!' });
    } catch {}
  };

  const fetchRoom = useCallback(async (code: string) => {
    try {
      const res = await fetch(API(`/room/${code}`));
      if (res.ok) {
        const data: RoomData = await res.json();
        setRoom(data);
        const me = data.players.find(p => p.username === username);
        if (me && data.phase !== 'lobby') setMyRole(me);
      }
    } catch {}
  }, [username]);

  useEffect(() => {
    fetch(API('/categories')).then(r => r.json()).then(setCategories).catch(() => {});
    fetch(API('/leaderboard/imposter')).then(r => r.json()).then(setLeaderboard).catch(() => {});
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const id = setInterval(() => fetchRoom(roomCode), 2500);
    return () => clearInterval(id);
  }, [roomCode, fetchRoom]);

  const createRoom = async () => {
    if (!username) return toast({ title: 'Login dulu ya!', variant: 'destructive' });
    const res = await fetch(API('/room/create'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType: 'imposter', hostUsername: username }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoomCode(data.code); setRoom(data); setScreen('room'); playSfx('notification');
    }
  };

  const joinRoom = async () => {
    if (!username || !joinCode.trim()) return;
    const res = await fetch(API('/room/join'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinCode.toUpperCase().trim(), username }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoomCode(data.code); setRoom(data); setScreen('room');
    } else toast({ title: 'Kode tidak valid!', variant: 'destructive' });
  };

  const startGame = async (categoryKey: string) => {
    const res = await fetch(API(`/room/${roomCode}/start`), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, categoryKey }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data);
      const me = data.players.find((p: Player) => p.username === username);
      if (me) { setMyRole(me); setShowRole(true); playSfx('notification'); }
    }
  };

  const submitClue = async () => {
    if (!clueInput.trim()) return;
    const res = await fetch(API(`/room/${roomCode}/clue`), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, clue: clueInput.trim() }),
    });
    if (res.ok) { setClueInput(''); setRoom(await res.json()); playSfx('message'); }
    else toast({ title: 'Bukan giliranmu!', variant: 'destructive' });
  };

  const submitVote = async (target: string) => {
    if (!room || room.votes.find((v: any) => v.from === username)) return toast({ title: 'Sudah vote!', variant: 'destructive' });
    const res = await fetch(API(`/room/${roomCode}/vote`), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, targetUsername: target }),
    });
    if (res.ok) { setRoom(await res.json()); playSfx('click'); }
  };

  const resetRoom = async () => {
    await fetch(API(`/room/${roomCode}/reset`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
    setMyRole(null); setShowRole(false); fetchRoom(roomCode);
  };

  const isHost = room?.hostUsername === username;
  const currentCluer = room?.clueOrder?.[room.currentClueIdx ?? 0];
  const iMyTurn = currentCluer === username;
  const myClueGiven = room?.clues?.find(c => c.username === username && c.round === room?.round);
  const myVote = room?.votes?.find((v: any) => v.from === username);
  const alivePlayers = room?.players?.filter(p => !p.eliminated) || [];

  if (screen === 'home') return (
    <div className="space-y-5 animate-in fade-in max-w-2xl mx-auto">
      <div className="glass rounded-3xl p-8 text-center">
        <div className="text-7xl mb-4">🎭</div>
        <h1 className="font-serif text-3xl font-bold mb-2 text-glow">Game Imposter</h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">Temukan Imposter melalui clue dan diskusi seru!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={createRoom} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold hover:opacity-90 transition-opacity">
            <Crown className="w-5 h-5" /> Buat Room
          </button>
          <button onClick={() => setScreen('join')} className="flex items-center justify-center gap-2 px-6 py-3 glass border border-white/20 rounded-xl font-semibold hover:bg-white/10 transition-colors">
            <Users className="w-5 h-5" /> Join Room
          </button>
        </div>
        <button onClick={() => setShowLB(!showLB)} className="mt-5 text-sm text-muted-foreground hover:text-white flex items-center gap-2 mx-auto">
          <Trophy className="w-4 h-4 text-yellow-400" /> Leaderboard
        </button>
      </div>
      {showLB && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Top Pemain</h3>
          {leaderboard.length === 0 ? <p className="text-muted-foreground text-sm text-center">Belum ada data</p> : (
            <div className="space-y-2">{leaderboard.slice(0,10).map((r: any, i: number) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground w-6">{i+1}.</span>
                <span className="flex-1">{r.username}</span>
                <span className="text-green-400 mr-2">{r.wins}W</span>
                <span className="text-red-400 mr-2">{r.losses}L</span>
                <span className="text-muted-foreground text-xs">{r.gamesPlayed}g</span>
              </div>
            ))}</div>
          )}
        </div>
      )}
      <div className="glass rounded-2xl p-5 space-y-2">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Cara Main</h3>
        {['Host buat room, share kode ke teman','Semua join, host pilih kategori','Setiap pemain dapat kata rahasia (Imposter dapat kata berbeda!)','Berikan clue secara bergiliran 2 putaran','Vote siapa Imposternya','Tebak benar = Warga menang, tebak salah = Imposter menang!'].map((s, i) => (
          <div key={i} className="flex gap-2 text-sm text-muted-foreground"><span className="text-primary font-bold shrink-0">{i+1}.</span> {s}</div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">20 Peran Rahasia</h3>
        <p className="text-xs text-muted-foreground mb-4">Setiap pemain mendapat peran acak yang menentukan strateginya!</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ROLES_20.map((r, i) => (
            <div key={i} className="flex gap-3 bg-white/5 rounded-xl p-3">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">{i+1}</div>
              <div>
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === 'join') return (
    <div className="max-w-sm mx-auto animate-in fade-in">
      <div className="glass rounded-3xl p-8 space-y-5">
        <h2 className="font-serif text-2xl font-bold text-center">Join Room</h2>
        <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="KODE"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:border-primary uppercase"
          maxLength={4} onKeyDown={e => e.key === 'Enter' && joinRoom()} />
        <button onClick={joinRoom} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold">Masuk</button>
        <button onClick={() => setScreen('home')} className="w-full text-muted-foreground text-sm">← Kembali</button>
      </div>
    </div>
  );

  if (!room) return <div className="text-center py-20 text-muted-foreground animate-pulse">Memuat room...</div>;

  if (room.phase === 'lobby') return (
    <div className="max-w-lg mx-auto animate-in fade-in space-y-4">
      <div className="glass rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold">Room Lobby 🎭</h2>
          <button onClick={() => { setScreen('home'); setRoomCode(''); setRoom(null); }} className="text-muted-foreground hover:text-white"><Home className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4">
          <div><p className="text-xs text-muted-foreground mb-1">Kode Room</p>
            <span className="font-mono text-4xl font-black tracking-[0.3em] text-primary">{room.code}</span></div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => shareToChat(room.code)}
              title="Kirim kode ke group chat"
              className="px-3 py-2 glass rounded-xl text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              📢 Chat
            </button>
            <button onClick={() => { navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-3 glass rounded-xl">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pemain</span>
            <span className="text-xs text-muted-foreground">{room.players.length}/15</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {room.players.map(p => (
              <div key={p.username} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-sm">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold">{p.username.substring(0,2).toUpperCase()}</div>
                <span className="truncate">{p.username}</span>
                {p.username === room.hostUsername && <Crown className="w-3 h-3 text-yellow-400 ml-auto shrink-0" />}
              </div>
            ))}
          </div>
        </div>
        {isHost && room.players.length >= 2 ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Pilih Kategori</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {categories.map((cat: any) => (
                <button key={cat.key} onClick={() => startGame(cat.key)} className="p-3 glass rounded-xl text-left hover:border-primary/50 border border-white/10 transition-all group">
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <div className="text-xs font-semibold group-hover:text-primary transition-colors">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>
        ) : isHost ? <p className="text-center text-sm text-muted-foreground">Butuh minimal 2 pemain</p>
        : <p className="text-center text-sm text-muted-foreground animate-pulse flex items-center justify-center gap-2"><span className="w-2 h-2 rounded-full bg-primary animate-ping inline-block" /> Menunggu host memulai...</p>}
      </div>
    </div>
  );

  if (showRole && myRole) return (
    <div className="max-w-sm mx-auto animate-in fade-in">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-8 text-center space-y-6">
        <div className="text-7xl">{myRole.isImposter ? '🎭' : '🎪'}</div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Role kamu</p>
          <h2 className="font-serif text-3xl font-bold mb-3">{myRole.role}</h2>
          {myRole.isImposter ? (
            <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-4">
              <p className="text-red-300 font-bold text-lg">⚠️ Kamu IMPOSTER!</p>
              <p className="text-red-400/80 text-sm mt-1">Katamu: "{myRole.word}"</p>
              <p className="text-muted-foreground text-xs mt-2">Katamu berbeda dari warga. Jangan ketahuan!</p>
            </div>
          ) : (
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-4">
              <p className="text-indigo-300 font-bold mb-1">Katamu:</p>
              <p className="text-3xl font-black tracking-wide">"{myRole.word}"</p>
              <p className="text-muted-foreground text-xs mt-2">Berikan clue tanpa menyebut kata ini langsung!</p>
            </div>
          )}
          {room.settings?.categoryName && <p className="text-xs text-muted-foreground mt-3">Kategori: {room.settings.categoryName}</p>}
        </div>
        <button onClick={() => setShowRole(false)} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold flex items-center justify-center gap-2">
          Siap! <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in space-y-4">
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-primary text-lg">{room.code}</span>
          <span className="text-muted-foreground text-xs">Ronde {room.round}</span>
          {room.settings?.categoryName && <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{room.settings.categoryName}</span>}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${room.phase.includes('clue') ? 'bg-blue-900/40 text-blue-300 border-blue-500/30' : room.phase === 'voting' ? 'bg-red-900/40 text-red-300 border-red-500/30' : 'bg-green-900/40 text-green-300 border-green-500/30'}`}>
          {room.phase === 'clue_round_1' ? '📢 Ronde 1' : room.phase === 'clue_round_2' ? '📢 Ronde 2' : room.phase === 'voting' ? '🗳️ Voting' : '🏆 Selesai'}
        </div>
      </div>

      {myRole && (
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${myRole.isImposter ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}>{myRole.isImposter ? '🎭' : '🎪'}</div>
            <div><p className="text-xs text-muted-foreground">Role</p><p className="font-semibold text-sm">{myRole.role}</p></div>
          </div>
          {!myRole.isImposter && (
            <div className="flex items-center gap-2">
              {showRole && <span className="font-mono bg-white/10 px-3 py-1 rounded-lg text-sm">{myRole.word}</span>}
              <button onClick={() => setShowRole(!showRole)} className="p-2 rounded-xl hover:bg-white/10">{showRole ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          )}
          {myRole.isImposter && <span className="text-xs text-red-400 bg-red-900/20 px-3 py-1.5 rounded-xl">IMPOSTER</span>}
        </div>
      )}

      <div className="glass rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Pemain</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {room.players.map(p => (
            <div key={p.username} className={`p-3 rounded-xl border text-sm ${p.eliminated ? 'opacity-40 border-red-500/20' : p.username === currentCluer && room.phase.includes('clue') ? 'border-blue-500/60 bg-blue-900/20 animate-pulse' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-[10px] font-bold">{p.username.substring(0,2).toUpperCase()}</div>
                <span className="truncate font-medium text-xs">{p.username}</span>
              </div>
              {p.hasGivenClue && !p.eliminated && room.phase.includes('clue') && <div className="text-[9px] text-green-400 mt-1">✓ Clue diberikan</div>}
              {p.eliminated && <div className="text-[9px] text-red-400 mt-1">{p.isImposter ? '🎭 Imposter!' : '❌ Out'}</div>}
            </div>
          ))}
        </div>
      </div>

      {(room.phase === 'clue_round_1' || room.phase === 'clue_round_2') && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Giliran:</span>
            <span className="text-primary font-bold">{currentCluer}</span>
            {iMyTurn && !myClueGiven && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full animate-pulse">Giliranmu!</span>}
          </div>
          {iMyTurn && !myClueGiven && (
            <div className="flex gap-2">
              <input value={clueInput} onChange={e => setClueInput(e.target.value)} placeholder="Ketik clue..."
                onKeyDown={e => e.key === 'Enter' && submitClue()}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
              <button onClick={submitClue} disabled={!clueInput.trim()} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-sm disabled:opacity-50">Kirim</button>
            </div>
          )}
          {iMyTurn && myClueGiven && <p className="text-sm text-green-400">✓ Clue kamu: "{myClueGiven.clue}"</p>}
          {room.clues.length > 0 && (
            <div className="border-t border-white/10 pt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clue masuk:</p>
              {room.clues.map((c, i) => (
                <div key={i} className="flex gap-2 text-sm p-2 rounded-xl bg-white/5">
                  <span className="text-primary font-semibold">{c.username}:</span>
                  <span>"{c.clue}"</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">R{c.round}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {room.phase === 'voting' && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><Vote className="w-4 h-4 text-red-400" /> Waktunya Vote!</h3>
          <div className="bg-white/5 rounded-xl p-3 space-y-1 max-h-36 overflow-y-auto">
            <p className="text-xs font-bold text-muted-foreground mb-2">Recap clue:</p>
            {room.clues.map((c, i) => (
              <div key={i} className="text-xs flex gap-2"><span className="text-primary font-semibold">{c.username}:</span><span>"{c.clue}"</span><span className="text-muted-foreground ml-auto">R{c.round}</span></div>
            ))}
          </div>
          {myVote ? (
            <div className="text-center py-3">
              <p className="text-sm">Kamu vote: <span className="text-red-400 font-bold">{myVote.target}</span></p>
              <p className="text-xs text-muted-foreground mt-1">{room.votes.length}/{alivePlayers.length} sudah vote</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Pilih siapa yang kamu curigai:</p>
              <div className="grid grid-cols-2 gap-2">
                {alivePlayers.filter(p => p.username !== username).map(p => (
                  <button key={p.username} onClick={() => submitVote(p.username)}
                    className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/20 hover:border-red-400/50 rounded-xl text-sm font-medium transition-all">
                    <Vote className="w-4 h-4 text-red-400" /> {p.username}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {room.phase === 'ended' && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-8 text-center space-y-5">
          <div className="text-7xl">{room.winner === 'villagers' ? '🎉' : '🎭'}</div>
          <h2 className="font-serif text-3xl font-bold">{room.winner === 'villagers' ? 'Warga Menang! 🎉' : 'Imposter Menang! 🎭'}</h2>
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Para Imposter:</p>
            {room.players.filter(p => p.isImposter).map(p => (
              <div key={p.username} className="flex items-center justify-between py-1">
                <span className="text-red-400 font-semibold">{p.username}</span>
                <span className="text-muted-foreground text-sm">"{p.word}"</span>
              </div>
            ))}
          </div>
          {isHost && <button onClick={resetRoom} className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold"><RotateCcw className="w-4 h-4" /> Main Lagi</button>}
        </motion.div>
      )}
    </div>
  );
}
