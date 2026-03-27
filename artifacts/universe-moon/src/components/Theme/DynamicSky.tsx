import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TimePhase = 'dawn' | 'day' | 'night';
type EventType = 'rain' | 'coin_rain' | 'fireworks' | 'confetti' | 'meteor' | 'stars' | 'snow' | 'hearts' | 'moon_rise' | 'galaxy_blast' | null;

const TW = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg';
const EVENT_IMGS: Record<string, string> = {
  rain:         `${TW}/1f327.svg`,
  coin_rain:    `${TW}/1fa99.svg`,
  fireworks:    `${TW}/1f386.svg`,
  confetti:     `${TW}/1f38a.svg`,
  meteor:       `${TW}/2604.svg`,
  stars:        `${TW}/2b50.svg`,
  snow:         `${TW}/2744.svg`,
  hearts:       `${TW}/1f495.svg`,
  moon_rise:    `${TW}/1f315.svg`,
  galaxy_blast: `${TW}/1f30c.svg`,
};

const TIME_IMGS: Record<TimePhase, string> = {
  dawn:  `${TW}/1f305.svg`,
  day:   `${TW}/2600.svg`,
  night: `${TW}/1f319.svg`,
};

const TIME_LABELS: Record<TimePhase, string> = {
  dawn:  'Pagi',
  day:   'Siang',
  night: 'Malam',
};

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
  return { phase, img: TIME_IMGS[phase], label: TIME_LABELS[phase], icon: TIME_IMGS[phase] };
}

function Particle({ type, onDone }: { type: EventType; onDone: () => void }) {
  const particles = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 2,
    dur: 1.8 + Math.random() * 2.5,
    size: type === 'coin_rain' ? 28 : type === 'moon_rise' ? 48 : 20 + Math.random() * 14,
    rotate: Math.random() * 360,
  })), [type]);

  const imgSrc = type ? EVENT_IMGS[type] : null;
  if (!type || !imgSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {particles.map(p => (
        <img
          key={p.id}
          src={imgSrc}
          alt=""
          style={{
            position: 'absolute',
            left: p.left,
            top: '-60px',
            width: p.size,
            height: p.size,
            animation: `fall ${p.dur}s ${p.delay}s linear`,
            animationFillMode: 'forwards',
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(0) rotate(0deg);    opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function EventCountdown({ seconds, label }: { seconds: number; label: string }) {
  if (seconds <= 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] glass border border-white/20 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-xl">
      <span className="text-sm font-semibold">{label}</span>
      <div className="bg-primary/20 rounded-lg px-3 py-1">
        <span className="font-mono text-sm font-bold text-primary">{seconds}s</span>
      </div>
    </motion.div>
  );
}

export function DynamicSky() {
  const { phase } = useTimePhase();
  const [activeEvent, setActiveEvent] = useState<{ type: EventType; id: number; duration: number; label: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const lastEventIdRef = useRef<number>(-1);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stars = useMemo(() => Array.from({ length: 70 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 75}%`,
    size: `${Math.random() * 2.5 + 0.5}px`,
    duration: `${Math.random() * 3 + 2}s`,
    delay: `${Math.random() * 2}s`,
  })), []);

  const startEvent = (eventData: { type: EventType; id: number; duration: number; label: string }) => {
    if (lastEventIdRef.current === eventData.id) return;
    lastEventIdRef.current = eventData.id;

    setActiveEvent(eventData);
    setCountdown(eventData.duration);

    if (countdownRef.current) clearInterval(countdownRef.current);
    let rem = eventData.duration;
    countdownRef.current = setInterval(() => {
      rem--;
      setCountdown(rem);
      if (rem <= 0) {
        clearInterval(countdownRef.current!);
        setActiveEvent(null);
        setCountdown(0);
      }
    }, 1000);
  };

  useEffect(() => {
    const checkEvent = async () => {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) return;
        const event = await res.json();
        if (event && event.isActive && event.id !== lastEventIdRef.current) {
          startEvent({
            type: event.type as EventType,
            id: event.id,
            duration: event.duration || 10,
            label: event.message || event.type,
          });
        }
      } catch {}
    };
    checkEvent();
    const id = setInterval(checkEvent, 10000);
    return () => { clearInterval(id); if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <AnimatePresence mode="sync">
          {phase === 'night' && (
            <motion.div key="night" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}
              className="absolute inset-0 bg-gradient-to-b from-[#02020c] via-[#04041a] to-[#060810]">
              {stars.map(star => (
                <div key={star.id} className="star" style={{ left: star.left, top: star.top, width: star.size, height: star.size, '--d': star.duration, '--dl': star.delay } as any} />
              ))}
              {/* Moon glow */}
              <div className="absolute top-6 right-[10%] w-32 h-32 rounded-full bg-white/[0.03] shadow-[0_0_120px_40px_rgba(255,255,255,0.06)]" />
              <div className="absolute top-4 right-[9%] w-28 h-28 rounded-full bg-white/[0.05]" style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 30% 100%, 0% 50%)' }} />
            </motion.div>
          )}
          {phase === 'dawn' && (
            <motion.div key="dawn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}
              className="absolute inset-0 bg-gradient-to-b from-[#0e0820] via-[#1a0e2a] to-[#06040e]">
              <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-orange-900/20 via-pink-900/10 to-transparent" />
              <div className="absolute bottom-[15%] left-[5%] w-96 h-48 rounded-full bg-orange-700/10 blur-3xl" />
              <div className="absolute bottom-[5%] right-[10%] w-72 h-36 rounded-full bg-pink-700/8 blur-3xl" />
              <div className="absolute top-[25%] left-[30%] w-20 h-20 rounded-full bg-amber-400/6 blur-2xl" />
              {stars.slice(0, 25).map(star => (
                <div key={star.id} className="star opacity-30" style={{ left: star.left, top: star.top, width: star.size, height: star.size, '--d': star.duration, '--dl': star.delay } as any} />
              ))}
            </motion.div>
          )}
          {phase === 'day' && (
            <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }}
              className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d1a32] to-[#08101e]">
              <div className="absolute top-0 left-0 right-0 h-[35%] bg-gradient-to-b from-blue-900/15 to-transparent" />
              <div className="absolute top-[5%] left-[15%] w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />
              <div className="absolute top-[3%] right-[20%] w-40 h-40 rounded-full bg-sky-400/4 blur-2xl" />
              <div className="absolute top-[8%] left-[40%] w-16 h-16 rounded-full bg-yellow-300/8 blur-xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Event Particles */}
      <AnimatePresence>
        {activeEvent && (
          <motion.div key={`event-${activeEvent.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Particle type={activeEvent.type} onDone={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown Badge */}
      <AnimatePresence>
        {activeEvent && countdown > 0 && (
          <EventCountdown seconds={countdown} label={activeEvent.label} />
        )}
      </AnimatePresence>
    </>
  );
}
