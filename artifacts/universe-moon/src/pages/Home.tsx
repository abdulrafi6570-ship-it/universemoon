import { useAuthStore } from '@/hooks/use-auth';
import { useGetMembers } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Camera, Book, MessageSquare, Ghost, Music, Key, Moon } from 'lucide-react';

export default function Home() {
  const { user } = useAuthStore();
  const { data: members = [] } = useGetMembers();
  
  const activeCount = members.filter(m => m.isActive).length;

  const quickLinks = [
    { icon: Camera, label: "Galeri Foto", href: "/gallery", color: "text-blue-400" },
    { icon: Book, label: "Memories", href: "/memories", color: "text-purple-400" },
    { icon: MessageSquare, label: "Chat", href: "/chat", color: "text-green-400" },
    { icon: Ghost, label: "NGL", href: "/ngl", color: "text-red-400" },
    { icon: Music, label: "Musik", href: "/music", color: "text-yellow-400" },
    { icon: Key, label: "Vault", href: "/vault", color: "text-gray-400" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative overflow-hidden rounded-3xl glass p-8 md:p-12 flex flex-col items-center justify-center text-center min-h-[340px]"
      >
        <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent pointer-events-none" />
        <div className="w-24 h-24 mb-6 relative z-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.15)]">
          <Moon className="w-12 h-12 text-white fill-white/30" />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-glow mb-4 relative z-10">Universe Moon</h1>
        <p className="text-muted-foreground max-w-lg mx-auto relative z-10 text-lg">
          Selamat datang kembali, <strong className="text-white">{user?.username}</strong>. 
          Tempat kenangan, cerita, dan ikatan yang tak pernah pudar. 🌙
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-3xl font-serif font-bold text-white mb-1">{activeCount || '—'}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Members</div>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-3xl font-serif font-bold text-white mb-1">27/11</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tanggal Dibuat</div>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-3xl font-serif font-bold text-white mb-1">iyuyun</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Founder</div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">Jelajahi Semesta</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className="glass glass-hover rounded-2xl p-6 flex flex-col items-center justify-center gap-3 group"
              >
                <Icon className={`w-8 h-8 ${link.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
}
