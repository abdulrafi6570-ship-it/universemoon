import { useQuery } from '@tanstack/react-query';
import { Clock, RefreshCw } from 'lucide-react';

export default function Activity() {
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['activity'],
    queryFn: () => fetch('/api/activity').then(r => r.json()),
    refetchInterval: 30000,
  });

  const timeAgo = (time: string) => {
    const diff = Date.now() - new Date(time).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days} hari lalu`;
    if (hrs > 0) return `${hrs} jam lalu`;
    if (mins > 0) return `${mins} menit lalu`;
    return 'Baru saja';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow">⚡ Aktivitas</h1>
          <p className="text-muted-foreground text-sm mt-1">Aktivitas terkini komunitas</p>
        </div>
        <button onClick={() => refetch()} className="p-2 glass hover:bg-white/10 rounded-xl transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Belum ada aktivitas</p>
          <p className="text-sm mt-2">Mulai berinteraksi di komunitas!</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[28px] top-0 bottom-0 w-px bg-white/10" />
          <div className="space-y-3">
            {(activities as any[]).map((act: any, idx: number) => (
              <div key={idx} className="flex gap-4 relative">
                <div className="w-14 h-14 flex-shrink-0 glass rounded-2xl flex items-center justify-center text-2xl z-10">
                  {act.icon}
                </div>
                <div className="glass rounded-2xl p-4 flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{act.text}</p>
                  {act.caption && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">"{act.caption}"</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(act.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
