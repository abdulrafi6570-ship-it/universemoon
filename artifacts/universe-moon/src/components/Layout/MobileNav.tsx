import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Home, MessageCircle, Users, Image as ImageIcon, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/hooks/use-auth';

const BOTTOM_LINKS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Galeri', href: '/gallery', icon: ImageIcon },
  { label: 'Board', href: '/leaderboard', icon: Trophy },
];

const MENU_SECTIONS = [
  {
    title: '🌟 Sosial',
    links: [
      { label: 'Shoutout Board', href: '/shoutout' },
      { label: 'Story Harian', href: '/story' },
      { label: 'Moodboard', href: '/moodboard' },
      { label: 'Q&A Anonim', href: '/qa' },
      { label: 'NGL', href: '/ngl' },
      { label: 'Voting & Poll', href: '/voting' },
    ],
  },
  {
    title: '🎨 Konten',
    links: [
      { label: 'Quote of the Day', href: '/quote' },
      { label: 'Cerita & Fanfic', href: '/fanfic' },
      { label: 'Meme Board', href: '/meme' },
      { label: 'Playlist Bersama', href: '/playlist' },
      { label: 'Stiker Kustom', href: '/stickers' },
    ],
  },
  {
    title: '💜 Spesial',
    links: [
      { label: 'Surat Rahasia', href: '/capsule' },
      { label: 'Mini Diary', href: '/diary' },
      { label: 'Birthday', href: '/birthday' },
      { label: 'Hall of Fame', href: '/hall-of-fame' },
      { label: 'Statistik', href: '/stats' },
      { label: 'Milestones', href: '/milestones' },
    ],
  },
  {
    title: '🎵 Media',
    links: [
      { label: 'Musik', href: '/music' },
      { label: 'MEP Videos', href: '/mep' },
      { label: 'Drakor Favorit', href: '/drakor' },
      { label: 'Vault Rahasia', href: '/vault' },
    ],
  },
  {
    title: '🎮 Ekstra',
    links: [
      { label: 'Games', href: '/games' },
      { label: 'OpMem', href: '/opmem' },
      { label: 'Memories', href: '/memories' },
      { label: 'Links', href: '/links' },
      { label: 'Peraturan & FAQ', href: '/rules' },
      { label: 'Aktivitas', href: '/activity' },
      { label: 'Tentang UM', href: '/about' },
    ],
  },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuthStore();

  return (
    <div className="md:hidden">
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-50 flex justify-around items-center pb-safe px-2 pt-2 pb-3">
        {BOTTOM_LINKS.map(link => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-0.5 p-2 rounded-xl text-xs font-medium transition-all min-w-[52px]",
                isActive ? "text-white bg-white/10" : "text-muted-foreground hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground")} />
              <span className="text-[10px]">{link.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-white min-w-[52px]"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 glass rounded-t-3xl p-5 z-50 max-h-[85vh] overflow-y-auto hide-scrollbar"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-serif text-xl font-bold">Menu</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile quick link */}
              {user && (
                <Link href="/profile" onClick={() => setIsOpen(false)} className="glass-hover p-4 rounded-2xl flex items-center gap-3 mb-5 border border-white/10">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">@{user.username}</p>
                    <p className="text-xs text-muted-foreground">Lihat profil</p>
                  </div>
                </Link>
              )}

              {/* Sections */}
              <div className="space-y-5">
                {MENU_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3">{section.title}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "glass-hover p-3 rounded-xl text-center text-xs transition-all",
                            location === link.href ? "bg-white/15 text-white" : "text-muted-foreground"
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin link */}
              {user?.role === 'admin' && (
                <Link href="/admin" onClick={() => setIsOpen(false)} className="glass-hover p-4 rounded-2xl flex items-center justify-center gap-2 mt-5 border border-purple-500/30 text-purple-300">
                  🛡️ Panel Admin
                </Link>
              )}

              {/* Ex members */}
              <Link href="/ex-members" onClick={() => setIsOpen(false)} className="glass-hover p-3 rounded-xl text-center text-xs text-muted-foreground mt-3 block">
                Ex-Members
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
