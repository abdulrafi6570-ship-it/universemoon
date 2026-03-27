import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Camera, Book, MessageSquare, Ghost, Music, Key, Moon, Users, Gamepad2, Video, Sparkles, Zap, Shield, Cloud, Star, Heart, Gift } from 'lucide-react';
import { useTimePhase } from '@/components/Theme/DynamicSky';
import { useToast } from '@/hooks/use-toast';

const EVENT_TYPES = [
  { key: 'rain', label: 'Hujan 🌧️', icon: '🌧️' },
  { key: 'coin_rain', label: 'Hujan Koin 🪙', icon: '🪙' },
  { key: 'fireworks', label: 'Kembang Api 🎆', icon: '🎆' },
  { key: 'confetti', label: 'Confetti 🎊', icon: '🎊' },
  { key: 'meteor', label: 'Meteor ☄️', icon: '☄️' },
  { key: 'stars', label: 'Bintang Jatuh ⭐', icon: '⭐' },
  { key: 'snow', label: 'Salju ❄️', icon: '❄️' },
  { key: 'hearts', label: 'Hujan Hati 💕', icon: '💕' },
  { key: 'moon_rise', label: 'Moon Rise 🌕', icon: '🌕' },
  { key: 'galaxy_blast', label: 'Galaxy Blast 🌌', icon: '🌌' },
];

export default function Home() {
  const { user } = useAuthStore();
  const { phase, icon } = useTimePhase();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [stats, setStats] = useState({ members: 0, photos: 0, messages: 0 });
  const [triggeringEvent, setTriggeringEvent] = useState(false);

  const greetings: Record<string, string> = {
    dawn: 'Selamat Pagi',
    day: 'Selamat Siang',
    night: 'Selamat Malam',
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/members').then(r => r.json()).catch(() => []),
      fetch('/api/photos').then(r => r.json()).catch(() => []),
      fetch('/api/chat').then(r => r.json()).catch(() => []),
    ]).then(([members, photos, chats]) => {
      setStats({ members: members.length || 0, photos: photos.length || 0, messages: chats.length || 0 });
    });
  }, []);

  const triggerEvent = async (type: string) => {
    if (!isAdmin) return;
    setTriggeringEvent(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, duration: 15, triggeredBy: user?.username }),
      });
      if (res.ok) toast({ title: `Event "${type}" aktif! Semua member akan melihatnya! ✨` });
      else toast({ title: 'Gagal trigger event', variant: 'destructive' });
    } finally { setTriggeringEvent(false); }
  };

  const quickLinks = [
    { icon: Camera, label: "Galeri", href: "/gallery", color: "text-blue-400", bg: "from-blue-500/10 to-blue-600/5" },
    { icon: Book, label: "Memories", href: "/memories", color: "text-purple-400", bg: "from-purple-500/10 to-purple-600/5" },
    { icon: MessageSquare, label: "Chat", href: "/chat", color: "text-green-400", bg: "from-green-500/10 to-green-600/5" },
    { icon: Ghost, label: "NGL", href: "/ngl", color: "text-pink-400", bg: "from-pink-500/10 to-pink-600/5" },
    { icon: Music, label: "Musik", href: "/music", color: "text-yellow-400", bg: "from-yellow-500/10 to-yellow-600/5" },
    { icon: Key, label: "Vault", href: "/vault", color: "text-gray-400", bg: "from-gray-500/10 to-gray-600/5" },
    { icon: Users, label: "Member", href: "/members", color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-600/5" },
    { icon: Gamepad2, label: "Games", href: "/games", color: "text-red-400", bg: "from-red-500/10 to-red-600/5" },
    { icon: Video, label: "MEP", href: "/mep", color: "text-orange-400", bg: "from-orange-500/10 to-orange-600/5" },
    { icon: Sparkles, label: "OpMem", href: "/opmem", color: "text-indigo-400", bg: "from-indigo-500/10 to-indigo-600/5" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative overflow-hidden rounded-3xl glass p-8 md:p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="absolute inset-0 bg-gradient-radial from-white/5 to-transparent pointer-events-none" />
        <div className="w-20 h-20 mb-5 relative z-10 rounded-full bg-white/8 border border-white/15 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.12)]">
          <Moon className="w-10 h-10 text-white fill-white/20" />
        </div>
        <p className="text-sm text-muted-foreground mb-2 relative z-10">{icon} {greetings[phase]}, <strong className="text-white">{user?.username}</strong>!</p>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-glow mb-3 relative z-10">Universe Moon</h1>
        <p className="text-muted-foreground text-sm max-w-sm relative z-10 leading-relaxed">
          Tempat kenangan, cerita, dan ikatan yang tak pernah pudar. UM berdiri sejak 27 November 2025. 🌙
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: stats.members, label: 'Total Member', icon: '👥' },
          { value: stats.photos, label: 'Foto Galeri', icon: '📸' },
          { value: stats.messages, label: 'Pesan Chat', icon: '💬' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-serif font-bold">{s.value || '—'}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Info Card */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <Star className="w-8 h-8 text-yellow-400 shrink-0" />
          <div><p className="text-xs text-muted-foreground">Didirikan</p><p className="font-bold">27 Nov 2025</p></div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <Heart className="w-8 h-8 text-pink-400 shrink-0" />
          <div><p className="text-xs text-muted-foreground">Founder</p><p className="font-bold">iyuyun</p></div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Jelajahi Universe</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}
                className={`glass glass-hover rounded-2xl p-4 flex flex-col items-center justify-center gap-2 group bg-gradient-to-br ${link.bg} hover:border-white/20 border border-transparent transition-all`}>
                <Icon className={`w-7 h-7 ${link.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-white transition-colors">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Admin Events Panel */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold">Admin: Event Spesial</h3>
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full ml-auto">Hanya terlihat admin</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Trigger efek visual untuk semua member selama 15 detik!</p>
          <div className="grid grid-cols-5 gap-2">
            {EVENT_TYPES.map(ev => (
              <button key={ev.key} onClick={() => triggerEvent(ev.key)} disabled={triggeringEvent}
                className="flex flex-col items-center gap-1 p-3 glass rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 group">
                <span className="text-2xl group-hover:scale-125 transition-transform">{ev.icon}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{ev.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Activity Teaser */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4 text-sm">
          <Zap className="w-4 h-4 text-yellow-400" /> Fitur Universe Moon
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '🎭', title: 'Game Imposter', desc: '15 kategori × 50 kata' },
            { icon: '🐺', title: 'Game Werewolf', desc: 'Malam vs Siang' },
            { icon: '🧛', title: 'Game Dracula', desc: 'Vampir di antara kita' },
            { icon: '🎲', title: 'Game Ludo', desc: 'Race ke rumah!' },
            { icon: '💌', title: 'NGL Anonim', desc: 'Kirim pesan rahasia' },
            { icon: '🎬', title: 'MEP Collection', desc: 'Multi Editor Project' },
            { icon: '🎵', title: 'Music Player', desc: 'YouTube + Audio lokal' },
            { icon: '🔒', title: 'Vault', desc: 'Konten rahasia UM' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-xl text-xs">
              <span className="text-lg">{f.icon}</span>
              <div><p className="font-semibold">{f.title}</p><p className="text-muted-foreground">{f.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
