import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth';
import {
  Home, Users, UserMinus, Image as ImageIcon, BookOpen, Link as LinkIcon,
  MessageCircle, Ghost, Music, Key, UsersRound, Video, Gamepad2, Trophy,
  Info, LogOut, CheckSquare, Tv, ShieldCheck, User, Cake, BookMarked,
  Zap, BookHeart, Megaphone, SmilePlus, Package, HelpCircle, ListMusic,
  Laugh, Quote, PenSquare, Sticker, Medal, BarChart3, Flag, Clock, Heart, Swords,
} from 'lucide-react';
import { useLogout } from '@workspace/api-client-react';

const NAV_ITEMS = [
  { section: 'Utama' },
  { label: 'Home', href: '/', icon: Home },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Ex-Members', href: '/ex-members', icon: UserMinus },
  { label: 'Profil Saya', href: '/profile', icon: User },
  { section: 'Kenangan' },
  { label: 'Galeri Foto', href: '/gallery', icon: ImageIcon },
  { label: 'Memories', href: '/memories', icon: BookMarked },
  { label: 'Links', href: '/links', icon: LinkIcon },
  { label: 'Milestones', href: '/milestones', icon: Flag },
  { label: 'Statistik Grup', href: '/stats', icon: BarChart3 },
  { section: 'Sosial' },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
  { label: 'NGL / Pesan', href: '/ngl', icon: Ghost },
  { label: 'APIPI (Keluarga)', href: '/apipi', icon: Heart },
  { label: 'Shoutout Board', href: '/shoutout', icon: Megaphone },
  { label: 'Moodboard', href: '/moodboard', icon: SmilePlus },
  { label: 'Q&A Anonim', href: '/qa', icon: HelpCircle },
  { label: 'Voting & Poll', href: '/voting', icon: CheckSquare },
  { section: 'Konten' },
  { label: 'Quote of the Day', href: '/quote', icon: Quote },
  { label: 'Cerita & Fanfic', href: '/fanfic', icon: PenSquare },
  { label: 'Meme Board', href: '/meme', icon: Laugh },
  { label: 'Playlist Bersama', href: '/playlist', icon: ListMusic },
  { label: 'Stiker Kustom', href: '/stickers', icon: Sticker },
  { section: 'Spesial' },
  { label: 'Surat Rahasia', href: '/capsule', icon: Package },
  { label: 'Mini Diary Grup', href: '/diary', icon: BookHeart },
  { label: 'Birthday Tracker', href: '/birthday', icon: Cake },
  { label: 'Hall of Fame', href: '/hall-of-fame', icon: Medal },
    { label: 'Battle', href: '/battle', icon: Swords },
  { section: 'Media' },
  { label: 'Musik', href: '/music', icon: Music },
  { label: 'MEP Videos', href: '/mep', icon: Video },
  { label: 'Drakor Favorit', href: '/drakor', icon: Tv },
  { label: 'Vault Rahasia', href: '/vault', icon: Key },
  { section: 'Ekstra' },
  { label: 'OpMem', href: '/opmem', icon: UsersRound },
  { label: 'Peraturan & FAQ', href: '/rules', icon: BookOpen },
  { label: 'Aktivitas', href: '/activity', icon: Zap },
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
          <span className="text-xs text-muted-foreground">[Um] · Est. 30/11/2025</span>
        </div>
      </div>

      {user && (
        <Link href="/profile" className="mb-6 px-3 py-3 glass rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors">
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
          <User className="w-3 h-3 text-muted-foreground/60" />
        </Link>
      )}

      <nav className="flex-1 flex flex-col gap-0.5">
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
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group",
                isActive 
                  ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-white")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {user?.role === 'admin' && (
        <Link
          href="/admin"
          className={cn(
            "mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
            location === '/admin'
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "text-purple-400 hover:bg-purple-500/10 border border-transparent"
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Panel Admin</span>
        </Link>
      )}
      <button 
        onClick={handleLogout}
        className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
