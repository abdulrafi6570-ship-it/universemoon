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

function Particle({ type }: { type: EventType }) {
  const particles = useMemo(() => Array.from({ length: 52 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 3,
    dur: 2.2 + Math.random() * 3,
    size: type === 'coin_rain' ? 30 : type === 'moon_rise' ? 52 : 18 + Math.random() * 18,
    rotate: Math.random() * 360,
  })), [type]);

  const imgSrc = type ? EVENT_IMGS[type] : null;
  if (!type || !imgSrc) return null;

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden opacity-70">
      {particles.map(p => (
        <img
          key={p.id}
          src={imgSrc}
          alt=""
          style={{
            position: 'absolute',
            left: p.left,
            top: '-70px',
            width: p.size,
            height: p.size,
            animation: `fall ${p.dur}s ${p.delay}s linear infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(0) rotate(0deg);       opacity: 0.8; }
          85%  { opacity: 0.6; }
          100% { transform: translateY(110vh) rotate(400deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function EventCountdown({ seconds, label }: { seconds: number; label: string }) {
  if (seconds <= 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div className="glass border border-white/20 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-2xl">
        <span className="text-sm font-semibold">{label}</span>
        <div className="bg-white/10 rounded-lg px-3 py-1">
          <span className="font-mono text-sm font-bold text-white">{seconds}s</span>
        </div>
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

  const stars = useMemo(() => Array.from({ length: 90 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 85}%`,
    size: `${Math.random() * 3 + 0.5}px`,
    duration: `${Math.random() * 4 + 2}s`,
    delay: `${Math.random() * 3}s`,
    bright: Math.random() > 0.85,
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
      {/* Background — rendered behind everything at z-[-1] */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <AnimatePresence mode="sync">

          {/* MALAM — hitam pekat dengan bintang */}
          {phase === 'night' && (
            <motion.div key="night"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2.5 }}
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at top, #03030f 0%, #000005 50%, #000000 100%)' }}
            >
              {/* Stars */}
              {stars.map(star => (
                <div key={star.id} className={star.bright ? 'star-bright' : 'star'}
                  style={{ left: star.left, top: star.top, width: star.size, height: star.size, '--d': star.duration, '--dl': star.delay } as any}
                />
              ))}
              {/* Moon crescent */}
              <div className="absolute top-8 right-[12%] w-36 h-36">
                <div className="absolute inset-0 rounded-full bg-white/[0.07] blur-2xl" />
                <div className="absolute inset-2 rounded-full"
                  style={{ background: 'radial-gradient(circle at 40% 50%, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
                />
              </div>
              {/* Deep space glow */}
              <div className="absolute top-0 left-1/4 w-[60%] h-[30%] rounded-full blur-[80px]"
                style={{ background: 'rgba(20, 10, 40, 0.5)' }}
              />
            </motion.div>
          )}

          {/* PAGI — langit biru keunguan subuh */}
          {phase === 'dawn' && (
            <motion.div key="dawn"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2.5 }}
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, #000814 0%, #0a1628 30%, #1a0a2e 60%, #2d0a1e 80%, #1a0510 100%)' }}
            >
              {/* Horizon glow */}
              <div className="absolute bottom-0 left-0 right-0 h-[45%]"
                style={{ background: 'linear-gradient(to top, rgba(180,60,0,0.25) 0%, rgba(220,80,20,0.12) 30%, transparent 100%)' }}
              />
              {/* Sun peeking */}
              <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[500px] h-[120px] rounded-full blur-[60px]"
                style={{ background: 'rgba(255,100,20,0.18)' }}
              />
              <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[200px] h-[80px] rounded-full blur-[40px]"
                style={{ background: 'rgba(255,160,40,0.22)' }}
              />
              {/* Fading stars */}
              {stars.slice(0, 30).map(star => (
                <div key={star.id} className="star opacity-20"
                  style={{ left: star.left, top: star.top, width: star.size, height: star.size, '--d': star.duration, '--dl': star.delay } as any}
                />
              ))}
              {/* Blue atmosphere */}
              <div className="absolute top-0 left-0 right-0 h-[40%]"
                style={{ background: 'linear-gradient(to bottom, rgba(10,20,60,0.6) 0%, transparent 100%)' }}
              />
            </motion.div>
          )}

          {/* SIANG — gelap cerah, dark navy biru */}
          {phase === 'day' && (
            <motion.div key="day"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2.5 }}
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, #060d1f 0%, #0b1a36 40%, #0d1f3c 70%, #06101f 100%)' }}
            >
              {/* Sun glow top-center */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] blur-[80px]"
                style={{ background: 'rgba(60,120,255,0.12)' }}
              />
              <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[200px] h-[100px] blur-[50px]"
                style={{ background: 'rgba(255,220,50,0.10)' }}
              />
              {/* Atmosphere */}
              <div className="absolute top-0 left-0 right-0 h-[55%]"
                style={{ background: 'linear-gradient(to bottom, rgba(15,35,80,0.5) 0%, transparent 100%)' }}
              />
              {/* Cloud-like wisps */}
              <div className="absolute top-[15%] left-[10%] w-80 h-24 blur-[50px] rounded-full"
                style={{ background: 'rgba(30,60,120,0.15)' }}
              />
              <div className="absolute top-[20%] right-[15%] w-60 h-20 blur-[40px] rounded-full"
                style={{ background: 'rgba(20,50,100,0.12)' }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Event Particles — behind UI content (z-[1]), above background (z-[-1]) */}
      <AnimatePresence>
        {activeEvent && (
          <motion.div key={`event-${activeEvent.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Particle type={activeEvent.type} />
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
