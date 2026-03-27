import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Skull, Moon, Sun, Crown, Copy, Check, Users, Vote, RotateCcw, Trophy, Home } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/use-sound';

const API = (p: string) => `/api/games${p}`;

const ROLES: Record<string, { icon: string; desc: string; team: string }> = {
  dracula: { icon: '🧛', desc: 'Setiap malam pilih siapa yang digigit', team: 'evil' },
  vampire: { icon: '🦇', desc: 'Bantu Dracula mengalahkan warga', team: 'evil' },
  villager: { icon: '🧑‍🤝‍🧑', desc: 'Temukan dan eliminasi semua vampir!', team: 'good' },
  vampire_hunter: { icon: '🧄', desc: 'Saat mati, bunuh satu vampir sebelum pergi', team: 'good' },
  priest: { icon: '✝️', desc: 'Malam hari, lindungi satu warga dari gigitan', team: 'good' },
};

export default function DraculaGame() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { playSfx } = useSound();

  const [screen, setScreen] = useState<'home'|'join'|'room'>('home');
  const [joinCode, setJoinCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [actionTarget, setActionTarget] = useState('');
  const [dayVote, setDayVote] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const username = user?.username || '';

  const fetchRoom = useCallback(async (code: string) => {
    try {
      const res = await fetch(API(`/room/${code}`));
      if (res.ok) setRoom(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetch(API('/leaderboard/dracula')).then(r => r.json()).then(setLeaderboard).catch(() => {});
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const id = setInterval(() => fetchRoom(roomCode), 2500);
    return () => clearInterval(id);
  }, [roomCode, fetchRoom]);

  const createRoom = async () => {
    if (!username) return toast({ title: 'Login dulu!', variant: 'destructive' });
    const res = await fetch(API('/room/create'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameType: 'dracula', hostUsername: username }) });
    if (res.ok) { const d = await res.json(); setRoomCode(d.code); setRoom(d); setScreen('room'); playSfx('notification'); }
  };

  const joinRoom = async () => {
    const res = await fetch(API('/room/join'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: joinCode.toUpperCase().trim(), username }) });
    if (res.ok) { const d = await res.json(); setRoomCode(d.code); setRoom(d); setScreen('room'); }
    else toast({ title: 'Kode tidak valid!', variant: 'destructive' });
  };

  const shareToChat = async (code: string) => {
    if (!username) return;
    try {
      await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: username, content: `🧛 Yuk main Game Dracula bareng! Join pake kode: *${code}* → Games → Dracula → Join Room` }),
      });
      toast({ title: '✅ Kode sudah dikirim ke group chat!' });
    } catch {}
  };

  const startGame = async () => {
    const res = await fetch(API(`/room/${roomCode}/start`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
    if (res.ok) { setRoom(await res.json()); playSfx('notification'); }
  };

  const nightAction = async () => {
    const res = await fetch(API(`/room/${roomCode}/night-action`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, targetUsername: actionTarget }) });
    if (res.ok) { setRoom(await res.json()); setActionTarget(''); playSfx('click'); }
    else toast({ title: 'Aksi tidak valid!', variant: 'destructive' });
  };

  const vote = async () => {
    const res = await fetch(API(`/room/${roomCode}/vote`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, targetUsername: dayVote }) });
    if (res.ok) { setRoom(await res.json()); setDayVote(''); playSfx('click'); }
    else toast({ title: 'Sudah vote atau tidak valid!', variant: 'destructive' });
  };

  const nextPhase = async () => {
    const res = await fetch(API(`/room/${roomCode}/next-phase`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
    if (res.ok) setRoom(await res.json());
  };

  const resetRoom = async () => {
    await fetch(API(`/room/${roomCode}/reset`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
    fetchRoom(roomCode);
  };

  const isHost = room?.hostUsername === username;
  const myPlayer = room?.players?.find((p: any) => p.username === username);
  const isAlive = myPlayer && !myPlayer.eliminated;
  const myRole = myPlayer?.role;
  const alivePlayers = room?.players?.filter((p: any) => !p.eliminated) || [];
  const myVoted = room?.votes?.find((v: any) => v.from === username);
  const nightActed = room?.nightActions?.find((a: any) => a.username === username);
  const isNight = room?.phase === 'night';
  const isDay = room?.phase === 'day';
  const roleInfo = myRole ? ROLES[myRole] : null;
  const canAct = isNight && isAlive && !nightActed && myRole && !['villager'].includes(myRole);

  if (screen === 'home') return (
    <div className="space-y-5 animate-in fade-in max-w-2xl mx-auto">
      <div className="glass rounded-3xl p-8 text-center border border-red-900/30">
        <div className="text-7xl mb-4">🧛</div>
        <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: '#c0392b' }}>Game Dracula</h1>
        <p className="text-muted-foreground text-sm mb-8">Warga vs Dracula dan para Vampir dalam malam yang gelap!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={createRoom} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-900 to-red-800 rounded-xl font-semibold hover:opacity-90 border border-red-700/50">
            <Crown className="w-5 h-5" /> Buat Room
          </button>
          <button onClick={() => setScreen('join')} className="flex items-center justify-center gap-2 px-6 py-3 glass border border-white/20 rounded-xl font-semibold hover:bg-white/10 transition-colors">
            <Users className="w-5 h-5" /> Join Room
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(ROLES).map(([role, info]) => (
          <div key={role} className={`glass rounded-2xl p-4 border ${info.team === 'good' ? 'border-blue-500/20' : 'border-red-700/30'}`}>
            <div className="text-2xl mb-2">{info.icon}</div>
            <p className="font-semibold text-sm capitalize">{role.replace('_', ' ')}</p>
            <p className="text-xs text-muted-foreground mt-1">{info.desc}</p>
          </div>
        ))}
      </div>
      {leaderboard.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Leaderboard</h3>
          <div className="space-y-2">{leaderboard.slice(0,5).map((r: any, i: number) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground w-5">{i+1}.</span><span className="flex-1">{r.username}</span>
              <span className="text-green-400 mr-2">{r.wins}W</span><span className="text-muted-foreground text-xs">{r.gamesPlayed}g</span>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );

  if (screen === 'join') return (
    <div className="max-w-sm mx-auto animate-in fade-in">
      <div className="glass rounded-3xl p-8 space-y-5 border border-red-900/30">
        <h2 className="font-serif text-2xl font-bold text-center">Join Room</h2>
        <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="KODE"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:border-red-500 uppercase" maxLength={4} onKeyDown={e => e.key === 'Enter' && joinRoom()} />
        <button onClick={joinRoom} className="w-full py-3 bg-gradient-to-r from-red-900 to-red-800 rounded-xl font-semibold border border-red-700/50">Masuk</button>
        <button onClick={() => setScreen('home')} className="w-full text-muted-foreground text-sm">← Kembali</button>
      </div>
    </div>
  );

  if (!room) return <div className="text-center py-20 text-muted-foreground animate-pulse">Memuat...</div>;

  if (room.phase === 'lobby') return (
    <div className="max-w-lg mx-auto animate-in fade-in">
      <div className="glass rounded-3xl p-6 space-y-5 border border-red-900/30">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold flex items-center gap-2">🧛 Lobby Dracula</h2>
          <button onClick={() => { setScreen('home'); setRoomCode(''); setRoom(null); }}><Home className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4">
          <div><p className="text-xs text-muted-foreground mb-1">Kode Room</p>
            <span className="font-mono text-4xl font-black tracking-[0.3em] text-red-400">{room.code}</span></div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => shareToChat(room.code)} title="Kirim ke group chat" className="px-3 py-2 glass rounded-xl text-xs font-semibold text-red-400 hover:bg-red-900/30 transition-colors">
              📢 Chat
            </button>
            <button onClick={() => { navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-3 glass rounded-xl">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {room.players.map((p: any) => (
            <div key={p.username} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-sm">
              <div className="w-7 h-7 rounded-full bg-red-900/30 flex items-center justify-center text-xs font-bold">{p.username.substring(0,2).toUpperCase()}</div>
              <span className="truncate">{p.username}</span>
              {p.username === room.hostUsername && <Crown className="w-3 h-3 text-yellow-400 ml-auto" />}
            </div>
          ))}
        </div>
        {isHost && room.players.length >= 2 ? (
          <button onClick={startGame} className="w-full py-3 bg-gradient-to-r from-red-900 to-red-800 border border-red-700/50 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Moon className="w-5 h-5" /> Mulai Malam
          </button>
        ) : isHost ? <p className="text-center text-sm text-muted-foreground">Butuh minimal 2 pemain</p>
        : <p className="text-center text-sm text-muted-foreground animate-pulse">Menunggu host...</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in space-y-4">
      <div className={`glass rounded-2xl p-4 flex items-center justify-between border ${isNight ? 'border-red-900/40' : 'border-orange-500/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isNight ? 'bg-red-900/40' : 'bg-orange-900/20'}`}>{isNight ? '🌑' : '🌅'}</div>
          <div><p className="text-xs text-muted-foreground">Hari {room.round || 1}</p><p className="font-bold">{isNight ? 'Malam Vampir' : 'Siang Pemburu'}</p></div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isNight ? 'bg-red-900/40 text-red-300 border-red-700/30' : 'bg-orange-900/30 text-orange-300 border-orange-500/20'}`}>
          {room.phase === 'ended' ? '🏆 Selesai' : isNight ? '🧛 Malam' : '☀️ Diskusi'}
        </div>
      </div>

      {myPlayer && (
        <div className={`glass rounded-2xl p-4 flex items-center justify-between ${myPlayer.eliminated ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{roleInfo?.icon || '❓'}</div>
            <div>
              <p className="text-xs text-muted-foreground">Rolemu</p>
              <p className="font-bold capitalize">{myRole?.replace('_', ' ') || '?'}</p>
              <p className="text-xs text-muted-foreground">{roleInfo?.desc}</p>
            </div>
          </div>
          {myPlayer.eliminated ? <span className="text-xs text-red-400 bg-red-900/20 px-3 py-1 rounded-xl">☠️ Eliminated</span>
            : <span className={`text-xs px-3 py-1 rounded-xl ${roleInfo?.team === 'good' ? 'bg-blue-900/20 text-blue-300' : 'bg-red-900/20 text-red-300'}`}>{roleInfo?.team === 'good' ? 'Tim Warga' : 'Tim Vampir'}</span>}
        </div>
      )}

      <div className="glass rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Pemain</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {room.players.map((p: any) => (
            <div key={p.username} className={`p-3 rounded-xl border text-sm ${p.eliminated ? 'opacity-40 border-red-900/40' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-900/30 flex items-center justify-center text-[10px] font-bold">{p.username.substring(0,2).toUpperCase()}</div>
                <span className="truncate text-xs font-medium">{p.username}</span>
              </div>
              {p.eliminated && <p className="text-[9px] text-red-400 mt-1">☠️{room.phase === 'ended' && p.role ? ` ${p.role}` : ''}</p>}
            </div>
          ))}
        </div>
      </div>

      {isNight && canAct && (
        <div className="glass rounded-2xl p-5 space-y-3 border border-red-900/30">
          <h3 className="font-bold flex items-center gap-2 text-red-400"><Skull className="w-4 h-4" /> Aksi Malam — {myRole === 'dracula' || myRole === 'vampire' ? 'Pilih korban' : myRole === 'priest' ? 'Lindungi siapa?' : 'Aksi hunter'}</h3>
          {room.lastNightResult && isDay && <div className="text-sm text-red-400 bg-red-900/20 rounded-xl p-3">🩸 {room.lastNightResult}</div>}
          <select value={actionTarget} onChange={e => setActionTarget(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500">
            <option value="">-- Pilih target --</option>
            {alivePlayers.filter((p: any) => p.username !== username).map((p: any) => <option key={p.username} value={p.username}>{p.username}</option>)}
          </select>
          <button onClick={nightAction} disabled={!actionTarget} className="w-full py-2.5 bg-red-900/50 border border-red-700/50 text-red-200 rounded-xl font-semibold text-sm disabled:opacity-50">Lakukan Aksi</button>
        </div>
      )}
      {isNight && nightActed && <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">✓ Aksi malam selesai. Menunggu yang lain...</div>}
      {isNight && isAlive && myRole === 'villager' && <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">😴 Kamu tidur... Tunggu siang hari.</div>}

      {isDay && isAlive && (
        <div className="glass rounded-2xl p-5 space-y-3 border border-orange-500/20">
          {room.lastNightResult && <div className="text-sm text-red-400 bg-red-900/20 rounded-xl p-3">🩸 {room.lastNightResult}</div>}
          <h3 className="font-bold flex items-center gap-2"><Vote className="w-4 h-4 text-orange-400" /> Vote Eliminasi!</h3>
          {myVoted ? <p className="text-center text-sm text-muted-foreground">Kamu vote: <span className="text-orange-400 font-bold">{myVoted.target}</span></p>
          : (
            <div>
              <select value={dayVote} onChange={e => setDayVote(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 mb-2">
                <option value="">-- Pilih tersangka vampir --</option>
                {alivePlayers.filter((p: any) => p.username !== username).map((p: any) => <option key={p.username} value={p.username}>{p.username}</option>)}
              </select>
              <button onClick={vote} disabled={!dayVote} className="w-full py-2.5 bg-orange-900/40 border border-orange-500/30 text-orange-200 rounded-xl font-semibold text-sm disabled:opacity-50">Vote!</button>
            </div>
          )}
          {isHost && <button onClick={nextPhase} className="w-full py-2 text-sm text-muted-foreground glass rounded-xl hover:text-white mt-2">Lanjut ke Malam (Host)</button>}
        </div>
      )}

      {room.phase === 'ended' && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-8 text-center space-y-5 border border-red-900/30">
          <div className="text-7xl">{room.winner === 'villagers' ? '🧄' : '🧛'}</div>
          <h2 className="font-serif text-3xl font-bold">{room.winner === 'villagers' ? 'Warga Menang! 🧄' : 'Vampir Menang! 🧛'}</h2>
          <div className="bg-white/5 rounded-2xl p-4 space-y-2">
            {room.players.map((p: any) => (
              <div key={p.username} className="flex justify-between text-sm">
                <span>{p.username}</span>
                <span className={`capitalize ${ROLES[p.role]?.team === 'evil' ? 'text-red-400' : 'text-blue-400'}`}>{ROLES[p.role]?.icon} {p.role?.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          {isHost && <button onClick={resetRoom} className="flex items-center gap-2 mx-auto px-6 py-3 bg-red-900/60 border border-red-700/50 rounded-xl font-semibold"><RotateCcw className="w-4 h-4" /> Main Lagi</button>}
        </motion.div>
      )}
    </div>
  );
}
