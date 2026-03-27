import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Users, Crown, Copy, Check, Vote, Trophy, RotateCcw, Home } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/use-sound';

const API = (p: string) => `/api/games${p}`;

const ROLES_INFO: Record<string, { icon: string; desc: string; team: string }> = {
  werewolf: { icon: '🐺', desc: 'Malam hari, pilih siapa yang dimakan', team: 'evil' },
  villager: { icon: '👨‍🌾', desc: 'Temukan dan eliminasi semua werewolf!', team: 'good' },
  doctor: { icon: '👨‍⚕️', desc: 'Malam hari, selamatkan satu orang dari serangan', team: 'good' },
  seer: { icon: '🔮', desc: 'Malam hari, lihat identitas satu orang', team: 'good' },
  hunter: { icon: '🏹', desc: 'Saat dimatikan, kamu bisa membunuh satu orang', team: 'good' },
};

export default function WerewolfGame() {
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
    fetch(API('/leaderboard/werewolf')).then(r => r.json()).then(setLeaderboard).catch(() => {});
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const id = setInterval(() => fetchRoom(roomCode), 2500);
    return () => clearInterval(id);
  }, [roomCode, fetchRoom]);

  const createRoom = async () => {
    if (!username) return toast({ title: 'Login dulu!', variant: 'destructive' });
    const res = await fetch(API('/room/create'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameType: 'werewolf', hostUsername: username }) });
    if (res.ok) { const d = await res.json(); setRoomCode(d.code); setRoom(d); setScreen('room'); playSfx('notification'); }
  };

  const joinRoom = async () => {
    if (!username || !joinCode.trim()) return;
    const res = await fetch(API('/room/join'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: joinCode.toUpperCase().trim(), username }) });
    if (res.ok) { const d = await res.json(); setRoomCode(d.code); setRoom(d); setScreen('room'); }
    else toast({ title: 'Kode tidak valid!', variant: 'destructive' });
  };

  const startGame = async () => {
    const res = await fetch(API(`/room/${roomCode}/start`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
    if (res.ok) { setRoom(await res.json()); playSfx('notification'); }
  };

  const nightAction = async () => {
    if (!actionTarget) return;
    const res = await fetch(API(`/room/${roomCode}/night-action`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, targetUsername: actionTarget }) });
    if (res.ok) { setRoom(await res.json()); setActionTarget(''); playSfx('click'); }
    else toast({ title: 'Aksi tidak valid!', variant: 'destructive' });
  };

  const vote = async () => {
    if (!dayVote) return;
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
  const roleInfo = myRole ? ROLES_INFO[myRole] : null;

  // Night action eligibility
  const canAct = isNight && isAlive && !nightActed && myRole && myRole !== 'villager';

  if (screen === 'home') return (
    <div className="space-y-5 animate-in fade-in max-w-2xl mx-auto">
      <div className="glass rounded-3xl p-8 text-center">
        <div className="text-7xl mb-4">🐺</div>
        <h1 className="font-serif text-3xl font-bold mb-2 text-glow">Werewolf</h1>
        <p className="text-muted-foreground text-sm mb-8">Game sosial deduktif klasik. Warga vs Werewolf!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={createRoom} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-gray-800 rounded-xl font-semibold hover:opacity-90 transition-opacity border border-white/10">
            <Crown className="w-5 h-5" /> Buat Room
          </button>
          <button onClick={() => setScreen('join')} className="flex items-center justify-center gap-2 px-6 py-3 glass border border-white/20 rounded-xl font-semibold hover:bg-white/10 transition-colors">
            <Users className="w-5 h-5" /> Join Room
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(ROLES_INFO).map(([role, info]) => (
          <div key={role} className={`glass rounded-2xl p-4 border ${info.team === 'good' ? 'border-blue-500/20' : 'border-red-500/20'}`}>
            <div className="text-2xl mb-2">{info.icon}</div>
            <p className="font-semibold text-sm capitalize">{role}</p>
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
      <div className="glass rounded-3xl p-8 space-y-5">
        <h2 className="font-serif text-2xl font-bold text-center">Join Room</h2>
        <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="KODE"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:border-primary uppercase" maxLength={4} onKeyDown={e => e.key === 'Enter' && joinRoom()} />
        <button onClick={joinRoom} className="w-full py-3 bg-gradient-to-r from-slate-700 to-gray-800 border border-white/10 rounded-xl font-semibold">Masuk</button>
        <button onClick={() => setScreen('home')} className="w-full text-muted-foreground text-sm">← Kembali</button>
      </div>
    </div>
  );

  if (!room) return <div className="text-center py-20 text-muted-foreground animate-pulse">Memuat...</div>;

  if (room.phase === 'lobby') return (
    <div className="max-w-lg mx-auto animate-in fade-in space-y-4">
      <div className="glass rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold flex items-center gap-2"><span className="text-2xl">🐺</span> Lobby Werewolf</h2>
          <button onClick={() => { setScreen('home'); setRoomCode(''); setRoom(null); }}><Home className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4">
          <div><p className="text-xs text-muted-foreground mb-1">Kode Room</p>
            <span className="font-mono text-4xl font-black tracking-[0.3em] text-white">{room.code}</span></div>
          <button onClick={() => { navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="ml-auto p-3 glass rounded-xl">
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {room.players.map((p: any) => (
            <div key={p.username} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-sm">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{p.username.substring(0,2).toUpperCase()}</div>
              <span className="truncate">{p.username}</span>
              {p.username === room.hostUsername && <Crown className="w-3 h-3 text-yellow-400 ml-auto" />}
            </div>
          ))}
        </div>
        {isHost && room.players.length >= 4 ? (
          <button onClick={startGame} className="w-full py-3 bg-gradient-to-r from-slate-700 to-gray-800 border border-white/10 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Moon className="w-5 h-5" /> Mulai Game
          </button>
        ) : isHost ? <p className="text-center text-sm text-muted-foreground">Butuh minimal 4 pemain</p>
        : <p className="text-center text-sm text-muted-foreground animate-pulse">Menunggu host...</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in space-y-4">
      <div className={`glass rounded-2xl p-4 flex items-center justify-between ${isNight ? 'border border-slate-500/30' : 'border border-yellow-500/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isNight ? 'bg-slate-900/60' : 'bg-yellow-900/30'}`}>{isNight ? '🌙' : '☀️'}</div>
          <div><p className="text-xs text-muted-foreground">Hari {room.round || 1}</p><p className="font-bold">{isNight ? 'Malam Hari' : 'Siang Hari'}</p></div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isNight ? 'bg-slate-900/60 text-slate-300' : 'bg-yellow-900/40 text-yellow-300'}`}>
          {room.phase === 'ended' ? '🏆 Selesai' : isNight ? '🌙 Malam' : '☀️ Diskusi'}
        </div>
      </div>

      {myPlayer && (
        <div className={`glass rounded-2xl p-4 flex items-center justify-between ${myPlayer.eliminated ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{roleInfo?.icon || '❓'}</div>
            <div>
              <p className="text-xs text-muted-foreground">Rolemu</p>
              <p className="font-bold capitalize">{myRole || '?'}</p>
              <p className="text-xs text-muted-foreground">{roleInfo?.desc}</p>
            </div>
          </div>
          {myPlayer.eliminated && <span className="text-xs text-red-400 bg-red-900/20 px-3 py-1 rounded-xl">Eliminated</span>}
          {!myPlayer.eliminated && <span className={`text-xs px-3 py-1 rounded-xl ${roleInfo?.team === 'good' ? 'bg-blue-900/20 text-blue-300' : 'bg-red-900/20 text-red-300'}`}>{roleInfo?.team === 'good' ? 'Tim Baik' : 'Tim Jahat'}</span>}
        </div>
      )}

      {room.seerResult && myRole === 'seer' && (
        <div className="glass rounded-2xl p-4 border border-purple-500/30">
          <p className="text-xs font-bold text-purple-300 mb-1">🔮 Hasil Penglihatan:</p>
          <p className="text-sm">{room.seerResult.target} adalah <span className={room.seerResult.isWerewolf ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>{room.seerResult.isWerewolf ? '🐺 WEREWOLF!' : '👨‍🌾 Warga'}</span></p>
        </div>
      )}

      <div className="glass rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Pemain ({alivePlayers.length} hidup)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {room.players.map((p: any) => (
            <div key={p.username} className={`p-3 rounded-xl border text-sm ${p.eliminated ? 'opacity-40 border-red-500/20 bg-red-900/10' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">{p.username.substring(0,2).toUpperCase()}</div>
                <span className="truncate text-xs font-medium">{p.username}</span>
                {p.username === room.hostUsername && <Crown className="w-3 h-3 text-yellow-400 ml-auto" />}
              </div>
              {p.eliminated && <p className="text-[9px] text-red-400 mt-1">☠️ Eliminated{room.phase === 'ended' && p.role ? ` (${p.role})` : ''}</p>}
            </div>
          ))}
        </div>
      </div>

      {isNight && canAct && (
        <div className="glass rounded-2xl p-5 space-y-3 border border-slate-500/20">
          <h3 className="font-bold flex items-center gap-2"><Moon className="w-4 h-4" /> Aksi Malam ({myRole === 'werewolf' ? 'Pilih korban' : myRole === 'doctor' ? 'Selamatkan siapa?' : 'Cek identitas siapa?'})</h3>
          <select value={actionTarget} onChange={e => setActionTarget(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary">
            <option value="">-- Pilih pemain --</option>
            {alivePlayers.filter((p: any) => myRole !== 'werewolf' || p.username !== username).map((p: any) => (
              <option key={p.username} value={p.username}>{p.username}</option>
            ))}
          </select>
          <button onClick={nightAction} disabled={!actionTarget} className="w-full py-2.5 bg-slate-800 border border-white/10 rounded-xl font-semibold text-sm disabled:opacity-50">Lakukan Aksi</button>
        </div>
      )}
      {isNight && nightActed && <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">✓ Kamu sudah melakukan aksi malam. Menunggu yang lain...</div>}
      {isNight && isAlive && myRole === 'villager' && <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">😴 Kamu tidur... Tunggu hingga siang hari.</div>}

      {isDay && isAlive && (
        <div className="glass rounded-2xl p-5 space-y-3 border border-yellow-500/20">
          <h3 className="font-bold flex items-center gap-2"><Vote className="w-4 h-4 text-yellow-400" /> Vote Eliminasi!</h3>
          {room.lastNightResult && <div className="text-sm text-red-400 bg-red-900/20 rounded-xl p-3">☠️ {room.lastNightResult}</div>}
          {myVoted ? (
            <p className="text-center text-sm text-muted-foreground">Kamu vote: <span className="text-yellow-400 font-bold">{myVoted.target}</span></p>
          ) : (
            <div>
              <select value={dayVote} onChange={e => setDayVote(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary mb-2">
                <option value="">-- Pilih tersangka --</option>
                {alivePlayers.filter((p: any) => p.username !== username).map((p: any) => <option key={p.username} value={p.username}>{p.username}</option>)}
              </select>
              <button onClick={vote} disabled={!dayVote} className="w-full py-2.5 bg-yellow-900/40 border border-yellow-500/30 text-yellow-200 rounded-xl font-semibold text-sm disabled:opacity-50">Vote!</button>
            </div>
          )}
          {isHost && <button onClick={nextPhase} className="w-full py-2 text-sm text-muted-foreground glass rounded-xl hover:text-white mt-2">Lanjut ke Malam (Host)</button>}
        </div>
      )}

      {room.phase === 'ended' && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-8 text-center space-y-5">
          <div className="text-7xl">{room.winner === 'villagers' ? '👨‍🌾' : '🐺'}</div>
          <h2 className="font-serif text-3xl font-bold">{room.winner === 'villagers' ? 'Warga Menang! 🎉' : 'Werewolf Menang! 🐺'}</h2>
          <div className="bg-white/5 rounded-2xl p-4 space-y-2">
            {room.players.map((p: any) => (
              <div key={p.username} className="flex justify-between text-sm">
                <span>{p.username}</span>
                <span className={`capitalize ${ROLES_INFO[p.role]?.team === 'evil' ? 'text-red-400' : 'text-blue-400'}`}>{ROLES_INFO[p.role]?.icon} {p.role}</span>
              </div>
            ))}
          </div>
          {isHost && <button onClick={resetRoom} className="flex items-center gap-2 mx-auto px-6 py-3 bg-slate-800 border border-white/10 rounded-xl font-semibold"><RotateCcw className="w-4 h-4" /> Main Lagi</button>}
        </motion.div>
      )}
    </div>
  );
}
