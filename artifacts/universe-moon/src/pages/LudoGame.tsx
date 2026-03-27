import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Trophy, RotateCcw, Crown, Copy, Check, Users, Home } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/use-sound';

const API = (p: string) => `/api/games${p}`;

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
const PLAYER_NAMES = ['Merah', 'Biru', 'Hijau', 'Kuning'];
const PLAYER_BG = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

// Simplified Ludo board path (52 outer cells, then home stretch per color)
// For visualization: just track position 0-51 for outer path
function LudoToken({ color, pos, idx }: { color: string; pos: number; idx: number }) {
  const isHome = pos < 0;
  return (
    <motion.div
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 0.3 }}
      style={{ backgroundColor: color }}
      className="w-5 h-5 rounded-full border-2 border-white/60 shadow-lg flex items-center justify-center text-[8px] font-bold text-white"
    >{idx + 1}</motion.div>
  );
}

function LudoBoard({ players, myColorIdx }: { players: any[]; myColorIdx: number }) {
  // Create a simple visual board 13x13
  const size = 13;
  const cells: (JSX.Element | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {Array.from({ length: size * size }).map((_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          // Determine cell type
          const isCenter = row >= 5 && row <= 7 && col >= 5 && col <= 7;
          const isHomeRed = row < 5 && col < 5;
          const isHomeBlue = row < 5 && col > 7;
          const isHomeGreen = row > 7 && col < 5;
          const isHomeYellow = row > 7 && col > 7;

          let bg = 'bg-white/10';
          if (isCenter) bg = 'bg-white/20';
          if (isHomeRed) bg = 'bg-red-500/30';
          if (isHomeBlue) bg = 'bg-blue-500/30';
          if (isHomeGreen) bg = 'bg-green-500/30';
          if (isHomeYellow) bg = 'bg-yellow-500/30';

          // Find tokens at this position
          const tokens: JSX.Element[] = [];
          players.forEach((p, pIdx) => {
            (p.tokens || []).forEach((pos: number, tIdx: number) => {
              // Map position to board cell (simplified)
              const cellNum = row * size + col;
              if (pos === cellNum && !isHomeRed && !isHomeBlue && !isHomeGreen && !isHomeYellow) {
                tokens.push(<LudoToken key={`${pIdx}-${tIdx}`} color={PLAYER_COLORS[pIdx]} pos={pos} idx={tIdx} />);
              }
            });
          });

          return (
            <div key={i} className={`${bg} rounded-sm aspect-square flex items-center justify-center`} style={{ minWidth: 0 }}>
              {tokens.length > 0 && <div className="flex flex-wrap gap-0 items-center justify-center">{tokens}</div>}
            </div>
          );
        })}
      </div>

      {/* Color Home Bases */}
      <div className="absolute top-1 left-1 w-[37%] h-[37%] rounded-xl bg-red-500/40 border border-red-500/30 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-2 p-2">
          {(players[0]?.tokens || [0,0,0,0]).filter((_: any, i: number) => i < 4).map((_: any, i: number) => {
            const inHome = !(players[0]?.tokens?.[i] >= 0);
            return <div key={i} className={`w-5 h-5 rounded-full ${inHome ? 'bg-red-400 border-2 border-white/60' : 'bg-red-900/40 border border-red-500/30'}`} />;
          })}
        </div>
      </div>
      <div className="absolute top-1 right-1 w-[37%] h-[37%] rounded-xl bg-blue-500/40 border border-blue-500/30 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-2 p-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="w-5 h-5 rounded-full bg-blue-400 border-2 border-white/60" />
          ))}
        </div>
      </div>
      <div className="absolute bottom-1 left-1 w-[37%] h-[37%] rounded-xl bg-green-500/40 border border-green-500/30 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-2 p-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="w-5 h-5 rounded-full bg-green-400 border-2 border-white/60" />
          ))}
        </div>
      </div>
      <div className="absolute bottom-1 right-1 w-[37%] h-[37%] rounded-xl bg-yellow-500/40 border border-yellow-500/30 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-2 p-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="w-5 h-5 rounded-full bg-yellow-400 border-2 border-white/60" />
          ))}
        </div>
      </div>

      {/* Center */}
      <div className="absolute top-[38%] left-[38%] w-[24%] h-[24%] rounded-xl bg-white/10 flex items-center justify-center">
        <Dices className="w-6 h-6 text-white/40" />
      </div>
    </div>
  );
}

export default function LudoGame() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { playSfx } = useSound();

  const [screen, setScreen] = useState<'home'|'join'|'room'>('home');
  const [joinCode, setJoinCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const username = user?.username || '';

  const fetchRoom = useCallback(async (code: string) => {
    try {
      const res = await fetch(API(`/room/${code}`));
      if (res.ok) setRoom(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetch(API('/leaderboard/ludo')).then(r => r.json()).then(setLeaderboard).catch(() => {});
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const id = setInterval(() => fetchRoom(roomCode), 2500);
    return () => clearInterval(id);
  }, [roomCode, fetchRoom]);

  const createRoom = async () => {
    if (!username) return toast({ title: 'Login dulu!', variant: 'destructive' });
    const res = await fetch(API('/room/create'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameType: 'ludo', hostUsername: username }) });
    if (res.ok) { const d = await res.json(); setRoomCode(d.code); setRoom(d); setScreen('room'); playSfx('notification'); }
  };

  const joinRoom = async () => {
    const res = await fetch(API('/room/join'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: joinCode.toUpperCase().trim(), username }) });
    if (res.ok) { const d = await res.json(); setRoomCode(d.code); setRoom(d); setScreen('room'); }
    else toast({ title: 'Kode tidak valid!', variant: 'destructive' });
  };

  const startGame = async () => {
    const res = await fetch(API(`/room/${roomCode}/start`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
    if (res.ok) { setRoom(await res.json()); playSfx('notification'); }
  };

  const rollDice = async () => {
    if (rolling) return;
    setRolling(true);
    playSfx('click');
    // Animate dice
    const rolls = Array.from({ length: 6 }, () => Math.ceil(Math.random() * 6));
    for (let r of rolls) {
      setDiceResult(r);
      await new Promise(res => setTimeout(res, 80));
    }
    const res = await fetch(API(`/room/${roomCode}/dice`), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data);
      setDiceResult(data.lastDice);
      playSfx('message');
    } else toast({ title: 'Bukan giliranmu!', variant: 'destructive' });
    setRolling(false);
  };

  const moveToken = async (tokenIdx: number) => {
    const res = await fetch(API(`/room/${roomCode}/move`), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, tokenIndex: tokenIdx }),
    });
    if (res.ok) { setRoom(await res.json()); playSfx('click'); }
    else toast({ title: 'Tidak bisa bergerak!', variant: 'destructive' });
  };

  const resetRoom = async () => {
    await fetch(API(`/room/${roomCode}/reset`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
    fetchRoom(roomCode);
  };

  const isHost = room?.hostUsername === username;
  const myColorIdx = room?.players?.findIndex((p: any) => p.username === username) ?? -1;
  const isMyTurn = room?.currentTurn === username;
  const myPlayer = room?.players?.[myColorIdx];
  const dice = room?.lastDice;
  const hasDiced = room?.turnState === 'move';

  const DICE_FACE = ['⚀','⚁','⚂','⚃','⚄','⚅'];

  if (screen === 'home') return (
    <div className="space-y-5 animate-in fade-in max-w-2xl mx-auto">
      <div className="glass rounded-3xl p-8 text-center">
        <div className="text-7xl mb-4">🎲</div>
        <h1 className="font-serif text-3xl font-bold mb-2 text-glow">Game Ludo</h1>
        <p className="text-muted-foreground text-sm mb-8">Race game klasik! Bawa semua pawak ke rumah pertama!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button onClick={createRoom} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-xl font-semibold hover:opacity-90">
            <Crown className="w-5 h-5" /> Buat Room
          </button>
          <button onClick={() => setScreen('join')} className="flex items-center justify-center gap-2 px-6 py-3 glass border border-white/20 rounded-xl font-semibold hover:bg-white/10 transition-colors">
            <Users className="w-5 h-5" /> Join Room
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PLAYER_NAMES.map((name, i) => (
            <div key={i} className={`p-3 rounded-xl ${PLAYER_BG[i]}/20 border border-white/10 text-center`}>
              <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ backgroundColor: PLAYER_COLORS[i] }} />
              <p className="text-xs font-semibold">{name}</p>
            </div>
          ))}
        </div>
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
        <button onClick={joinRoom} className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-xl font-semibold">Masuk</button>
        <button onClick={() => setScreen('home')} className="w-full text-muted-foreground text-sm">← Kembali</button>
      </div>
    </div>
  );

  if (!room) return <div className="text-center py-20 text-muted-foreground animate-pulse">Memuat...</div>;

  if (room.phase === 'lobby') return (
    <div className="max-w-lg mx-auto animate-in fade-in">
      <div className="glass rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold">🎲 Lobby Ludo</h2>
          <button onClick={() => { setScreen('home'); setRoomCode(''); setRoom(null); }}><Home className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4">
          <div><p className="text-xs text-muted-foreground mb-1">Kode Room</p>
            <span className="font-mono text-4xl font-black tracking-[0.3em] text-emerald-400">{room.code}</span></div>
          <button onClick={() => { navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="ml-auto p-3 glass rounded-xl">
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {room.players.map((p: any, i: number) => (
            <div key={p.username} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-sm">
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: PLAYER_COLORS[i] }} />
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{p.username.substring(0,2).toUpperCase()}</div>
              <span className="truncate">{p.username}</span>
              {p.username === room.hostUsername && <Crown className="w-3 h-3 text-yellow-400 ml-auto" />}
            </div>
          ))}
        </div>
        {isHost && room.players.length >= 2 ? (
          <button onClick={startGame} className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Dices className="w-5 h-5" /> Mulai Game
          </button>
        ) : isHost ? <p className="text-center text-sm text-muted-foreground">Butuh minimal 2 pemain (max 4)</p>
        : <p className="text-center text-sm text-muted-foreground animate-pulse">Menunggu host...</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto animate-in fade-in space-y-4">
      {/* Turn indicator */}
      <div className={`glass rounded-2xl p-4 flex items-center justify-between border ${isMyTurn ? 'border-emerald-500/40 bg-emerald-900/10' : 'border-white/10'}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: myColorIdx >= 0 ? PLAYER_COLORS[myColorIdx] : '#888' }} />
          <span className="text-sm font-semibold">{isMyTurn ? '🎲 Giliranmu!' : `Giliran: ${room.currentTurn}`}</span>
        </div>
        {diceResult && <span className="text-4xl">{DICE_FACE[diceResult - 1]}</span>}
      </div>

      {/* Board */}
      <div className="glass rounded-3xl p-4">
        <LudoBoard players={room.players || []} myColorIdx={myColorIdx} />
      </div>

      {/* Players Status */}
      <div className="glass rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Status Pemain</p>
        <div className="grid grid-cols-2 gap-2">
          {room.players.map((p: any, i: number) => (
            <div key={p.username} className={`p-3 rounded-xl border text-sm ${p.username === room.currentTurn ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLAYER_COLORS[i] }} />
                <span className="text-xs font-medium truncate">{p.username}</span>
                {p.username === room.hostUsername && <Crown className="w-3 h-3 text-yellow-400 ml-auto" />}
              </div>
              <div className="flex gap-1">
                {(p.tokens || [0,0,0,0]).slice(0,4).map((pos: number, ti: number) => (
                  <div key={ti} className={`w-4 h-4 rounded-full border text-[8px] flex items-center justify-center font-bold ${pos >= 56 ? 'bg-yellow-400 border-yellow-300 text-black' : pos >= 0 ? 'border-white/40' : 'bg-white/20 border-white/20'}`}
                    style={pos >= 0 && pos < 56 ? { backgroundColor: PLAYER_COLORS[i] } : {}}
                    onClick={() => isMyTurn && hasDiced && p.username === username ? moveToken(ti) : null}
                  >
                    {pos >= 56 ? '🏠' : ti+1}
                  </div>
                ))}
              </div>
              {p.finishTime && <p className="text-[10px] text-yellow-400 mt-1">🏆 Selesai!</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isMyTurn && (
        <div className="glass rounded-2xl p-5 space-y-3 border border-emerald-500/20">
          {!hasDiced ? (
            <button onClick={rollDice} disabled={rolling}
              className="w-full py-4 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Dices className={`w-6 h-6 ${rolling ? 'animate-spin' : ''}`} />
              {rolling ? 'Melempar...' : 'Lempar Dadu!'}
              {diceResult && !rolling && <span className="text-2xl">{DICE_FACE[diceResult-1]}</span>}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-center">Dadu: <span className="text-2xl">{DICE_FACE[(diceResult||1)-1]}</span> ({diceResult}). Pilih pawak mana yang mau digeser:</p>
              <div className="grid grid-cols-4 gap-2">
                {(myPlayer?.tokens || []).map((pos: number, ti: number) => (
                  <button key={ti} onClick={() => moveToken(ti)} disabled={pos >= 56}
                    className="py-2 rounded-xl border font-bold text-sm disabled:opacity-30 transition-all hover:border-emerald-500 border-white/20 bg-white/5"
                    style={{ color: pos >= 56 ? '#aaa' : PLAYER_COLORS[myColorIdx] }}>
                    P{ti+1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {room.phase === 'ended' && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-8 text-center space-y-4">
          <div className="text-7xl">🏆</div>
          <h2 className="font-serif text-3xl font-bold">Permainan Selesai!</h2>
          <div className="bg-white/5 rounded-2xl p-4 space-y-2">
            {room.rankings?.map((r: any, i: number) => (
              <div key={r.username} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-muted-foreground">{i+1}.</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLAYER_COLORS[room.players.findIndex((p: any) => p.username === r.username)] }} />
                <span>{r.username}</span>
                {i === 0 && <Trophy className="w-4 h-4 text-yellow-400 ml-auto" />}
              </div>
            ))}
          </div>
          {isHost && <button onClick={resetRoom} className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-xl font-semibold"><RotateCcw className="w-4 h-4" /> Main Lagi</button>}
        </motion.div>
      )}
    </div>
  );
}
