import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Crown, Medal, Gamepad2, Swords } from 'lucide-react';
import { motion } from 'framer-motion';

function getLevel(xp: number) {
  if (xp < 10) return 1; if (xp < 30) return 2; if (xp < 60) return 3;
  if (xp < 100) return 4; if (xp < 150) return 5; if (xp < 220) return 6;
  if (xp < 300) return 7; if (xp < 400) return 8; if (xp < 550) return 9;
  return 10;
}

export default function Leaderboard() {
  const [tab, setTab] = useState<'xp' | 'games'>('xp');

  const { data: xpBoard = [] } = useQuery({
    queryKey: ['leaderboard-xp'],
    queryFn: () => fetch('/api/leaderboard').then(r => r.json()),
  });

  const { data: gameBoard = [] } = useQuery({
    queryKey: ['leaderboard-games'],
    queryFn: () => fetch('/api/leaderboard/games').then(r => r.json()),
  });

  const board = tab === 'xp' ? xpBoard : gameBoard;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
      <div className="text-center space-y-4">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        <h1 className="text-3xl font-serif font-bold">Hall of Fame</h1>
        <p className="text-muted-foreground text-sm">Peringkat terbaik Universe Moon</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 glass rounded-2xl p-1.5 max-w-sm mx-auto">
        <button onClick={() => setTab('xp')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'xp' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}>
          <Star className="w-4 h-4" /> Aktivitas (XP)
        </button>
        <button onClick={() => setTab('games')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'games' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}>
          <Gamepad2 className="w-4 h-4" /> Game Wins
        </button>
      </div>

      {tab === 'xp' ? (
        <div className="glass rounded-3xl p-2 md:p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-semibold">Member Paling Aktif</p>
            <span className="text-xs text-muted-foreground ml-auto">berdasarkan XP</span>
          </div>
          {(xpBoard as any[]).map((user: any, idx: number) => (
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.07 }}
              key={user.id}
              className={`flex items-center gap-4 p-4 rounded-2xl ${idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30' : 'glass hover:bg-white/8 transition-colors'}`}>
              <div className="w-8 text-center font-bold text-lg font-serif shrink-0">
                {idx === 0 ? <Crown className="w-6 h-6 text-yellow-400 mx-auto" /> :
                 idx === 1 ? <Medal className="w-6 h-6 text-gray-300 mx-auto" /> :
                 idx === 2 ? <Medal className="w-6 h-6 text-orange-400 mx-auto" /> :
                 <span className="text-muted-foreground text-sm">#{idx + 1}</span>}
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold overflow-hidden border border-white/20 shrink-0">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" /> : user.username?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold truncate ${idx === 0 ? 'text-yellow-400 text-lg' : 'text-white'}`}>{user.username}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-mono">Lv {getLevel(user.xp || 0)}</span>
                  <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(user.xp || 0) % 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-bold font-mono">{user.xp || 0}</div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-widest">XP</div>
              </div>
            </motion.div>
          ))}
          {xpBoard.length === 0 && <div className="text-center py-10 text-muted-foreground">Belum ada data XP.</div>}
        </div>
      ) : (
        <div className="glass rounded-3xl p-2 md:p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Swords className="w-4 h-4 text-red-400" />
            <p className="text-sm font-semibold">Pemain Terbaik</p>
            <span className="text-xs text-muted-foreground ml-auto">berdasarkan kemenangan game</span>
          </div>
          {(gameBoard as any[]).map((player: any, idx: number) => (
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.07 }}
              key={idx}
              className={`flex items-center gap-4 p-4 rounded-2xl ${idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30' : 'glass hover:bg-white/8 transition-colors'}`}>
              <div className="w-8 text-center shrink-0">
                {idx === 0 ? <Crown className="w-6 h-6 text-yellow-400 mx-auto" /> :
                 idx === 1 ? <Medal className="w-6 h-6 text-gray-300 mx-auto" /> :
                 idx === 2 ? <Medal className="w-6 h-6 text-orange-400 mx-auto" /> :
                 <span className="text-muted-foreground text-sm">#{idx + 1}</span>}
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold overflow-hidden border border-white/20 shrink-0">
                {player.username?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold truncate ${idx === 0 ? 'text-yellow-400 text-lg' : 'text-white'}`}>{player.username}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{player.gameType || 'All'}</span>
                  <span className="text-xs text-green-400">{player.wins || 0}W</span>
                  <span className="text-xs text-red-400">{player.losses || 0}L</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-bold font-mono text-green-400">{player.wins || 0}</div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-widest">Wins</div>
              </div>
            </motion.div>
          ))}
          {gameBoard.length === 0 && <div className="text-center py-10 text-muted-foreground">Belum ada data kemenangan.</div>}
        </div>
      )}
    </div>
  );
}
