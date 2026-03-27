import { useGetLeaderboard } from '@workspace/api-client-react';
import { Trophy, Star, Crown, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Leaderboard() {
  const { data: board = [] } = useGetLeaderboard();

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
      <div className="text-center space-y-4">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        <h1 className="text-3xl font-serif font-bold">Hall of Fame</h1>
        <p className="text-muted-foreground text-sm">Peringkat member paling aktif di Universe Moon.</p>
      </div>

      <div className="glass rounded-3xl p-2 md:p-6 space-y-3">
        {board.map((user, idx) => {
          const isTop3 = idx < 3;
          return (
            <motion.div 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: idx * 0.1 }}
              key={user.id} 
              className={`flex items-center gap-4 p-4 rounded-2xl ${idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30' : 'glass hover:bg-white/10 transition-colors'}`}
            >
              <div className="w-8 text-center font-bold text-lg font-serif">
                {idx === 0 ? <Crown className="w-6 h-6 text-yellow-400 mx-auto"/> : 
                 idx === 1 ? <Medal className="w-6 h-6 text-gray-300 mx-auto"/> : 
                 idx === 2 ? <Medal className="w-6 h-6 text-orange-400 mx-auto"/> : 
                 <span className="text-muted-foreground">#{idx + 1}</span>}
              </div>
              
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold overflow-hidden border border-white/20 shrink-0">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover"/> : user.username.substring(0,2).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold truncate ${idx === 0 ? 'text-yellow-400 text-lg' : 'text-white'}`}>{user.username}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-sm bg-white/10 text-white font-mono">Lv {user.level}</span>
                  <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(user.xp % 100)}%` }} />
                  </div>
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <div className="text-xl font-bold font-mono">{user.xp}</div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-widest">XP</div>
              </div>
            </motion.div>
          );
        })}
        {board.length === 0 && <div className="text-center py-10 text-muted-foreground">Belum ada data.</div>}
      </div>
    </div>
  );
}
