import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MAIN_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Chat', href: '/chat' },
  { label: 'Members', href: '/members' },
  { label: 'Galeri', href: '/gallery' },
  { label: 'Games', href: '/games' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  return (
    <div className="md:hidden">
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-50 px-4 py-2 flex justify-between items-center pb-safe">
        {MAIN_LINKS.slice(0,4).map(link => (
          <Link 
            key={link.href} 
            href={link.href}
            className={cn(
              "flex flex-col items-center p-2 rounded-xl text-xs font-medium transition-all",
              location === link.href ? "text-white bg-white/10" : "text-muted-foreground hover:text-white"
            )}
          >
            {link.label}
          </Link>
        ))}
        <button 
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center p-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-white"
        >
          <Menu className="w-5 h-5 mb-1" />
          More
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
              className="fixed bottom-0 left-0 right-0 glass rounded-t-3xl p-6 z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl font-bold">Menu</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 rounded-full"><X className="w-5 h-5"/></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/games" onClick={() => setIsOpen(false)} className="glass-hover p-4 rounded-xl text-center">Games</Link>
                <Link href="/memories" onClick={() => setIsOpen(false)} className="glass-hover p-4 rounded-xl text-center">Memories</Link>
                <Link href="/ngl" onClick={() => setIsOpen(false)} className="glass-hover p-4 rounded-xl text-center">NGL</Link>
                <Link href="/music" onClick={() => setIsOpen(false)} className="glass-hover p-4 rounded-xl text-center">Music</Link>
                <Link href="/vault" onClick={() => setIsOpen(false)} className="glass-hover p-4 rounded-xl text-center">Vault</Link>
                <Link href="/leaderboard" onClick={() => setIsOpen(false)} className="glass-hover p-4 rounded-xl text-center">Leaderboard</Link>
                <Link href="/voting" onClick={() => setIsOpen(false)} className="glass-hover p-4 rounded-xl text-center">Voting</Link>
                <Link href="/drakor" onClick={() => setIsOpen(false)} className="glass-hover p-4 rounded-xl text-center">Drakor</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
