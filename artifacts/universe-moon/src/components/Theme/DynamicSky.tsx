import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function DynamicSky() {
  const [timePhrase, setTimePhrase] = useState<'dawn' | 'day' | 'night'>('night');
  
  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setTimePhrase('dawn');
      else if (hour >= 11 && hour < 18) setTimePhrase('day');
      else setTimePhrase('night');
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const stars = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 2}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-1000 bg-[#070707]">
      <AnimatePresence mode="crossfade">
        {timePhrase === 'night' && (
          <motion.div
            key="night"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-gradient-to-b from-[#050510] to-[#0a0a1a]"
          >
            {stars.map((star) => (
              <div
                key={star.id}
                className="star"
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  '--d': star.duration,
                  '--dl': star.delay,
                } as any}
              />
            ))}
            <div className="absolute top-10 right-[10%] w-32 h-32 rounded-full bg-white/5 shadow-[0_0_60px_rgba(255,255,255,0.1)] blur-sm" />
          </motion.div>
        )}
        
        {timePhrase === 'dawn' && (
          <motion.div
            key="dawn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-gradient-to-b from-[#2a1b38] via-[#1a1025] to-[#070707]"
          >
             <div className="absolute bottom-[20%] left-[20%] w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />
             <div className="absolute bottom-[10%] right-[30%] w-96 h-32 rounded-full bg-pink-500/5 blur-3xl" />
          </motion.div>
        )}

        {timePhrase === 'day' && (
          <motion.div
            key="day"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-gradient-to-b from-[#101525] via-[#0a0c18] to-[#070707]"
          >
             <div className="absolute top-[10%] left-[10%] w-48 h-48 rounded-full bg-blue-400/5 blur-3xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
