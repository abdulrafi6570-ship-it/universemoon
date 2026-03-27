import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { DynamicSky } from '../Theme/DynamicSky';
import { MusicBar } from '../MusicBar';
import { useAuthStore } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Clock, Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/hooks/use-sound';
import { useState, useEffect } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  const { user, isGuest, isLoading } = useAuthStore();
  const { soundEnabled, toggleSound } = useSound();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#070707] text-white">Loading cosmos...</div>;
  }

  if (!user && !isGuest) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="flex h-screen overflow-hidden text-foreground">
      <DynamicSky />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-[2] pb-20 md:pb-0 scroll-smooth">
        <header className="sticky top-0 z-20 glass border-b border-x-0 border-t-0 border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-sm tracking-wider">{time.toLocaleTimeString([], { hour12: false })}</span>
          </div>
          <button onClick={toggleSound} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
          </button>
        </header>
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
      <MobileNav />
      <MusicBar />
    </div>
  );
}
