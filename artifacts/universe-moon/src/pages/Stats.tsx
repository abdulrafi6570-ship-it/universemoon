import { useQuery } from '@tanstack/react-query';
import { Users, MessageCircle, Image, Music, PenSquare, SmilePlus, BookMarked, Megaphone, Clock } from 'lucide-react';

export default function Stats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/stats').then(r => r.json()),
    refetchInterval: 60000,
  });

  const founded = new Date('2025-11-30');
  const now = new Date();
  const days = Math.floor((now.getTime() - founded.getTime()) / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  const statItems = [
    { label: 'Anggota Aktif', value: stats?.members || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Pesan', value: stats?.messages || 0, icon: MessageCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Foto di Galeri', value: stats?.photos || 0, icon: Image, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Kenangan', value: stats?.memories || 0, icon: BookMarked, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { label: 'Koleksi Musik', value: stats?.songs || 0, icon: Music, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Cerita & Fanfic', value: stats?.fanfics || 0, icon: PenSquare, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Meme Diposting', value: stats?.memes || 0, icon: SmilePlus, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Shoutout Dikirim', value: stats?.shoutouts || 0, icon: Megaphone, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-glow">📊 Statistik Grup</h1>
        <p className="text-muted-foreground text-sm mt-1">Data & angka Universe Moon</p>
      </div>

      {/* Age Banner */}
      <div className="glass rounded-2xl p-6 mb-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="text-5xl font-serif font-bold text-glow mb-2">{days}</div>
        <div className="text-muted-foreground text-sm">hari Universe Moon berdiri</div>
        <div className="text-xs text-muted-foreground mt-1">({months} bulan {remainingDays} hari)</div>
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Berdiri sejak 30 November 2025 · Founder: iyuyun
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">{[...Array(9)].map((_, i) => <div key={i} className="glass rounded-2xl h-24 animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="glass rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className={`text-3xl font-bold ${item.color}`}>{item.value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
