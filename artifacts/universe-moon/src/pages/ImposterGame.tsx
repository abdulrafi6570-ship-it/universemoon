import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertTriangle, ShieldAlert, ChevronRight, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth';
import { useSound } from '@/hooks/use-sound';

export default function ImposterGame() {
  const { user } = useAuthStore();
  const { playSfx } = useSound();
  
  const [phase, setPhase] = useState<'setup' | 'discussion' | 'voting' | 'elimination' | 'end'>('setup');
  const [players, setPlayers] = useState<string[]>(['']);
  const [gameState, setGameState] = useState<any>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [myName, setMyName] = useState(user?.username || '');
  const [timer, setTimer] = useState(0);

  // Setup functions
  const addPlayerInput = () => { if (players.length < 10) setPlayers([...players, '']); };
  const updatePlayer = (i: number, val: string) => {
    const newP = [...players];
    newP[i] = val;
    setPlayers(newP);
  };
  
  const startGame = () => {
    const validPlayers = players.filter(p => p.trim());
    if (validPlayers.length < 3) return alert('Min 3 players');
    
    // Simple client side logic for now to ensure it works without API
    const roles = ['imposter'];
    while(roles.length < validPlayers.length) roles.push('crewmate');
    // Shuffle
    roles.sort(() => Math.random() - 0.5);
    
    const initialPlayers = validPlayers.map((name, i) => ({
      name,
      role: roles[i],
      isAlive: true,
      votes: 0
    }));

    setGameState({
      players: initialPlayers,
      imposterCount: 1
    });
    setPhase('discussion');
    setTimer(120); // 2 mins
    playSfx('notification');
  };

  useEffect(() => {
    if (timer > 0 && (phase === 'discussion' || phase === 'voting')) {
      const id = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(id);
    } else if (timer === 0 && phase === 'discussion') {
      setPhase('voting');
      setTimer(60);
    }
  }, [timer, phase]);

  const checkMyRole = () => {
    if(!gameState) return;
    const me = gameState.players.find((p: any) => p.name.toLowerCase() === myName.toLowerCase());
    if (me) setMyRole(me.role);
    else alert('Nama tidak ada di game');
  };

  const castVote = (targetName: string) => {
    if (!gameState) return;
    const newPlayers = gameState.players.map((p: any) => 
      p.name === targetName ? { ...p, votes: p.votes + 1 } : p
    );
    setGameState({ ...gameState, players: newPlayers });
    playSfx('click');
  };

  const endVoting = () => {
    if (!gameState) return;
    let maxVotes = -1;
    let eliminated = null;
    
    gameState.players.forEach((p: any) => {
      if (p.votes > maxVotes) { maxVotes = p.votes; eliminated = p; }
      else if (p.votes === maxVotes) { eliminated = null; } // Tie
    });

    if (eliminated && maxVotes > 0) {
      const newPlayers = gameState.players.map((p: any) => 
        p.name === eliminated.name ? { ...p, isAlive: false } : p
      );
      setGameState({ ...gameState, players: newPlayers, lastEliminated: eliminated.name });
    } else {
      setGameState({ ...gameState, lastEliminated: null }); // Skip
    }
    
    setPhase('elimination');
  };

  const nextRound = () => {
    // Check win condition
    const aliveImposters = gameState.players.filter((p: any) => p.role === 'imposter' && p.isAlive).length;
    const aliveCrew = gameState.players.filter((p: any) => p.role === 'crewmate' && p.isAlive).length;
    
    if (aliveImposters === 0) {
      setGameState({ ...gameState, winner: 'Crewmates' });
      setPhase('end');
      playSfx('notification');
    } else if (aliveImposters >= aliveCrew) {
      setGameState({ ...gameState, winner: 'Imposter' });
      setPhase('end');
      playSfx('error');
    } else {
      // Reset votes
      const newPlayers = gameState.players.map((p: any) => ({ ...p, votes: 0 }));
      setGameState({ ...gameState, players: newPlayers });
      setPhase('discussion');
      setTimer(120);
    }
  };

  if (phase === 'setup') {
    return (
      <div className="max-w-xl mx-auto glass p-8 rounded-3xl mt-8">
        <div className="text-center mb-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-serif mb-2">Who is Imposter</h1>
          <p className="text-muted-foreground text-sm">Masukkan nama pemain (min 3, max 10)</p>
        </div>
        
        <div className="space-y-3 mb-6">
          {players.map((p, i) => (
            <input 
              key={i} 
              value={p} 
              onChange={e => updatePlayer(i, e.target.value)}
              placeholder={`Player ${i+1}`}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500"
            />
          ))}
          {players.length < 10 && (
            <button onClick={addPlayerInput} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-sm text-muted-foreground hover:bg-white/5 transition-colors">
              + Tambah Player
            </button>
          )}
        </div>
        <button onClick={startGame} className="w-full bg-red-600 text-white font-bold rounded-xl py-4 hover:bg-red-700 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.4)]">
          Mulai Game
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-4">
      <div className="glass p-6 rounded-3xl flex justify-between items-center bg-black/50 border-white/5">
        <div className="flex items-center gap-4">
          <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest">{phase} PHASE</h2>
            {phase !== 'end' && (
              <p className="text-sm font-mono text-muted-foreground">Timer: {Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</p>
            )}
          </div>
        </div>
        
        {phase === 'discussion' && (
          <button onClick={() => {setPhase('voting'); setTimer(60);}} className="bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/20">Skip to Voting</button>
        )}
        {phase === 'voting' && (
          <button onClick={endVoting} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(220,38,38,0.4)]">End Vote</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass p-6 rounded-3xl">
          {phase === 'end' ? (
            <div className="text-center py-20">
              <h1 className={`text-6xl font-bold mb-4 uppercase ${gameState.winner === 'Imposter' ? 'text-red-500' : 'text-blue-400'}`}>
                {gameState.winner} WIN!
              </h1>
              <p className="text-muted-foreground mb-8">Game Over.</p>
              <button onClick={() => setPhase('setup')} className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto">
                <RotateCcw className="w-4 h-4"/> Main Lagi
              </button>
            </div>
          ) : phase === 'elimination' ? (
            <div className="text-center py-20 animate-in zoom-in duration-500">
              {gameState.lastEliminated ? (
                <>
                  <div className="text-2xl mb-2">{gameState.lastEliminated}</div>
                  <div className="text-4xl font-bold text-red-500">Ejected.</div>
                  <p className="text-muted-foreground mt-4 text-sm">
                    {gameState.players.find((p:any)=>p.name===gameState.lastEliminated)?.role === 'imposter' ? 'They were an Imposter.' : 'They were not an Imposter.'}
                  </p>
                </>
              ) : (
                <div className="text-4xl font-bold text-gray-400">No one was ejected (Tie/Skip).</div>
              )}
              <button onClick={nextRound} className="mt-8 bg-white/10 px-6 py-3 rounded-full hover:bg-white/20">Lanjut Round</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {gameState?.players.map((p: any, i: number) => (
                <div key={i} className={`p-4 rounded-2xl border ${p.isAlive ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/20 opacity-50'} relative`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${!p.isAlive && 'line-through text-red-400'}`}>{p.name}</span>
                    {phase === 'voting' && p.isAlive && (
                      <button onClick={() => castVote(p.name)} className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded hover:bg-red-500 hover:text-white">Vote</button>
                    )}
                  </div>
                  {phase === 'voting' && p.votes > 0 && (
                    <div className="mt-2 text-xs font-mono text-red-400 bg-red-500/10 inline-block px-2 rounded">
                      Votes: {p.votes}
                    </div>
                  )}
                  {!p.isAlive && (
                    <div className="text-[10px] mt-2 uppercase tracking-widest text-red-400">Role: {p.role}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-3xl h-fit border border-primary/20 bg-primary/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5"/> My Role</h3>
          {!myRole ? (
            <div className="space-y-3">
              <input value={myName} onChange={e=>setMyName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-center" placeholder="Nama Anda di game"/>
              <button onClick={checkMyRole} className="w-full bg-primary text-white rounded-lg py-2 text-sm font-bold">Show Role</button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Anda adalah</div>
              <div className={`text-3xl font-bold font-serif ${myRole === 'imposter' ? 'text-red-500' : 'text-blue-400'}`}>
                {myRole.toUpperCase()}
              </div>
              <button onClick={()=>setMyRole(null)} className="text-xs text-muted-foreground underline mt-4">Sembunyikan</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
