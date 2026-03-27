import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TimePhase = 'dawn' | 'day' | 'night';
type EventType = 'rain' | 'coin_rain' | 'fireworks' | 'confetti' | 'meteor' | 'stars' | 'snow' | 'hearts' | 'moon_rise' | 'galaxy_blast' | null;

const TIME_ICONS: Record<TimePhase, string> = { dawn: '🌅', day: '☀️', night: '🌙' };

function getTimePhase(hour: number): TimePhase {
  if (hour >= 5 && hour < 11) return 'dawn';
  if (hour >= 11 && hour < 18) return 'day';
  return 'night';
}

export function useTimePhase() {
  const [phase, setPhase] = useState<TimePhase>(getTimePhase(new Date().getHours()));
  useEffect(() => {
    const update = () => setPhase(getTimePhase(new Date().getHours()));
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);
  return { phase, icon: TIME_ICONS[phase] };
}

function Particle({ type }: { type: EventType }) {
  const particles = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    dur: `${1.5 + Math.random() * 2}s`,
    size: type === 'coin_rain' ? 16 : type === 'snow' ? 8 + Math.random() * 8 : 6 + Math.random() * 6,
  })), [type]);

  const emoji: Record<string, string> = {
    rain: '💧', coin_rain: '🪙', fireworks: '🎆', confetti: '🎊',
    meteor: '☄️', stars: '⭐', snow: '❄️', hearts: '💕',
    moon_rise: '🌕', galaxy_blast: '🌌',
  };

  if (!type) return null;

  return (
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0 animate-bounce"
          style={{
            left: p.left,
            fontSize: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
            animation: `fall ${p.dur} ${p.delay} linear infinite`,
          }}
        >
          {emoji[type] || '✨'}
        </div>
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

export function DynamicSky() {
  const { phase } = useTimePhase();
  const [activeEvent, setActiveEvent] = useState<EventType>(null);

  const stars = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 70}%`,
    size: `${Math.random() * 3 + 1}px`,
    duration: `${Math.random() * 3 + 2}s`,
    delay: `${Math.random() * 2}s`,
  })), []);

  // Poll for admin events every 10 seconds
  useEffect(() => {
    const checkEvent = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const event = await res.json();
          if (event && event.isActive) {
            setActiveEvent(event.type as EventType);
            setTimeout(() => setActiveEvent(null), (event.duration || 10) * 1000);
          }
        }
      } catch {}
    };
    checkEvent();
    const id = setInterval(checkEvent, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#060610]">
        <AnimatePresence mode="sync">
          {phase === 'night' && (
            <motion.div key="night" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}
              className="absolute inset-0 bg-gradient-to-b from-[#04040f] via-[#06061a] to-[#08080f]">
              {stars.map(star => (
                <div key={star.id} className="star" style={{ left: star.left, top: star.top, width: star.size, height: star.size, '--d': star.duration, '--dl': star.delay } as any} />
              ))}
              <div className="absolute top-8 right-[12%] w-28 h-28 rounded-full bg-white/[0.04] shadow-[0_0_80px_rgba(255,255,255,0.08)] blur-sm" />
              <div className="absolute top-6 right-[11%] w-24 h-24 rounded-full bg-white/[0.06]" style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 30% 100%, 0% 50%)' }} />
            </motion.div>
          )}

          {phase === 'dawn' && (
            <motion.div key="dawn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}
              className="absolute inset-0 bg-gradient-to-b from-[#18102a] via-[#2a1525] to-[#08060f]">
              <div className="absolute bottom-[15%] left-[15%] w-72 h-72 rounded-full bg-orange-600/10 blur-3xl" />
              <div className="absolute bottom-[5%] right-[25%] w-80 h-40 rounded-full bg-pink-600/8 blur-3xl" />
              <div className="absolute top-[20%] right-[20%] w-24 h-24 rounded-full bg-amber-400/5 blur-2xl" />
              {stars.slice(0, 20).map(star => (
                <div key={star.id} className="star opacity-40" style={{ left: star.left, top: star.top, width: star.size, height: star.size, '--d': star.duration, '--dl': star.delay } as any} />
              ))}
            </motion.div>
          )}

          {phase === 'day' && (
            <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}
              className="absolute inset-0 bg-gradient-to-b from-[#0d1420] via-[#090c18] to-[#060810]">
              <div className="absolute top-[8%] left-[8%] w-48 h-48 rounded-full bg-blue-400/6 blur-3xl" />
              <div className="absolute top-[5%] right-[15%] w-32 h-32 rounded-full bg-sky-300/5 blur-2xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeEvent && (
          <motion.div key={activeEvent} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Particle type={activeEvent} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
