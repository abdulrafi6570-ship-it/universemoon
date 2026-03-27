import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth';
import {
  Home, Users, UserMinus, Image as ImageIcon, BookOpen, Link as LinkIcon,
  MessageCircle, Ghost, Music, Key, UsersRound, Video, Gamepad2, Trophy,
  Info, LogOut
} from 'lucide-react';
import { useLogout } from '@workspace/api-client-react';

const NAV_ITEMS = [
  { section: 'Utama' },
  { label: 'Home', href: '/', icon: Home },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Ex-Members', href: '/ex-members', icon: UserMinus },
  { section: 'Kenangan' },
  { label: 'Galeri Foto', href: '/gallery', icon: ImageIcon },
  { label: 'Memories', href: '/memories', icon: BookOpen },
  { label: 'Links', href: '/links', icon: LinkIcon },
  { section: 'Sosial' },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
  { label: 'NGL / Pesan', href: '/ngl', icon: Ghost },
  { label: 'Musik', href: '/music', icon: Music },
  { label: 'Vault Rahasia', href: '/vault', icon: Key },
  { section: 'Ekstra' },
  { label: 'OpMem', href: '/opmem', icon: UsersRound },
  { label: 'MEP Videos', href: '/mep', icon: Video },
  { label: 'Games', href: '/games', icon: Gamepad2 },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { section: 'System' },
  { label: 'Tentang UM', href: '/about', icon: Info },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutLocal } = useAuthStore();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      logoutLocal();
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 h-screen overflow-y-auto hide-scrollbar glass border-y-0 border-l-0 border-r border-white/10 flex flex-col p-4 z-10 sticky top-0 hidden md:flex">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-serif font-bold text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] shrink-0">
          UM
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-glow">Universe Moon</span>
          <span className="text-xs text-muted-foreground">[Um] · Est. 2025</span>
        </div>
      </div>

      {user && (
        <div className="mb-6 px-3 py-3 glass rounded-xl flex items-center gap-3">
          {user.avatarUrl ? (
             <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-semibold truncate">{user.username}</span>
            <span className="text-[10px] text-muted-foreground capitalize">{user.role}</span>
          </div>
        </div>
      )}

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item, idx) => {
          if (item.section) {
            return (
              <div key={`sec-${idx}`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4 mb-2 px-3">
                {item.section}
              </div>
            );
          }

          const isActive = location === item.href;
          const Icon = item.icon!;

          return (
            <Link 
              key={item.href} 
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group",
                isActive 
                  ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-white")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button 
        onClick={handleLogout}
        className="mt-8 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
