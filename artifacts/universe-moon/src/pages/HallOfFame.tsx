import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Gamepad2, Crown } from 'lucide-react';

export default function HallOfFame() {
  const { data: hof, isLoading } = useQuery({
    queryKey: ['hall-of-fame'],
    queryFn: () => fetch('/api/hall-of-fame').then(r => r.json()),
  });

  const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  const Section = ({ title, icon, items, valueKey, valueLabel }: any) => (
    <div className="glass rounded-2xl p-5 mb-6">
      <h2 className="font-bold mb-5 flex items-center gap-2 text-lg">
        {icon} {title}
      </h2>
      {!items || items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada data</p>
      ) : (
        <div className="space-y-3">
          {items.map((item: any, idx: number) => (
            <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${idx === 0 ? 'glass bg-yellow-400/5 border border-yellow-400/20' : 'glass hover:bg-white/5'}`}>
              <span className="text-2xl w-8 text-center flex-shrink-0">{MEDALS[idx]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt={item.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {item.username?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold truncate">@{item.username}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-bold text-lg ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : ''}`}>
                  {item[valueKey]?.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">{valueLabel}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-glow flex items-center gap-2"><Trophy className="w-7 h-7 text-yellow-400" /> Hall of Fame</h1>
        <p className="text-muted-foreground text-sm mt-1">Para legenda Universe Moon 🌙</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-48 animate-pulse" />)}</div>
      ) : (
        <>
          <Section title="XP Tertinggi" icon={<Crown className="w-5 h-5 text-yellow-400" />} items={hof?.topXp} valueKey="xp" valueLabel="XP" />
          <Section title="Streak Terpanjang" icon={<Flame className="w-5 h-5 text-orange-400" />} items={hof?.topStreak} valueKey="streak" valueLabel="hari beruntun" />
          <div className="glass rounded-2xl p-5 mb-6">
            <h2 className="font-bold mb-5 flex items-center gap-2 text-lg">
              <Gamepad2 className="w-5 h-5 text-blue-400" /> Master Games
            </h2>
            {!hof?.topGames || hof.topGames.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada data permainan</p>
            ) : (
              <div className="space-y-3">
                {hof.topGames.map((item: any, idx: number) => (
                  <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl glass ${idx === 0 ? 'bg-blue-400/5 border border-blue-400/20' : ''}`}>
                    <span className="text-2xl w-8 text-center flex-shrink-0">{MEDALS[idx]}</span>
                    <span className="font-semibold flex-1">@{item.username}</span>
                    <div className="text-right">
                      <span className={`font-bold text-lg ${idx === 0 ? 'text-blue-400' : ''}`}>{item.wins}</span>
                      <p className="text-xs text-muted-foreground">kemenangan</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
