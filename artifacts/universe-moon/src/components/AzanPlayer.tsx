import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, MapPin, ChevronRight, Moon } from 'lucide-react';
import { usePrayerTimes } from '@/hooks/use-prayer-times';

// Azan YouTube IDs — short beautiful azans
const AZAN_OPTIONS = [
  { label: 'Makkah (Pendek)', ytId: 'rOY3Yp3LFMM' },
  { label: 'Azan Merdu', ytId: 'CQHF3HjF72k' },
  { label: 'Azan Klasik', ytId: 'GtinVDIhPKs' },
];

function formatTime(date: Date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function countdown(to: Date) {
  const diff = to.getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h} jam ${m} menit lagi`;
  return `${m} menit lagi`;
}

const PRAYER_ICONS: Record<string, string> = {
  subuh:   '🌙',
  dzuhur:  '☀️',
  ashar:   '🌤️',
  maghrib: '🌅',
  isya:    '🌃',
};

export function AzanPlayer() {
  const { times, nextPrayer, azanActive, dismissAzan, enabled, toggleEnabled, location } = usePrayerTimes();
  const [open, setOpen] = useState(false);
  const [azanIdx, setAzanIdx] = useState(0);

  return (
    <>
      {/* Trigger button — lives in the layout header */}
      <button
        onClick={() => setOpen(true)}
        className={`relative p-2 rounded-full hover:bg-white/10 transition-colors ${enabled ? 'text-primary' : 'text-muted-foreground'}`}
        title="Jadwal Shalat"
      >
        {enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        {enabled && nextPrayer && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Prayer times panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 h-full w-80 max-w-full z-50 glass border-l border-white/15 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-serif text-lg font-bold">🕌 Jadwal Shalat</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{location} · WIB</span>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Next prayer highlight */}
              {nextPrayer && (
                <div className="mx-4 mt-4 p-4 rounded-2xl bg-white/8 border border-white/12">
                  <p className="text-xs text-muted-foreground mb-1">Shalat berikutnya</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{PRAYER_ICONS[nextPrayer.key]}</span>
                      <div>
                        <p className="font-bold text-base">{nextPrayer.name}</p>
                        <p className="text-sm text-primary font-mono">{formatTime(nextPrayer.time)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{countdown(nextPrayer.time)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Prayer times list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Hari ini</p>
                {times.map(p => {
                  const isNext = nextPrayer?.key === p.key;
                  const isPast = p.time < new Date();
                  return (
                    <div key={p.key} className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                      isNext ? 'bg-primary/15 border border-primary/30' :
                      isPast ? 'opacity-40' : 'bg-white/5 border border-white/8'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{PRAYER_ICONS[p.key]}</span>
                        <div>
                          <p className={`font-semibold text-sm ${isNext ? 'text-primary' : ''}`}>{p.name}</p>
                          {isPast && !isNext && <p className="text-[10px] text-muted-foreground">Sudah lewat</p>}
                        </div>
                      </div>
                      <p className={`font-mono text-sm font-bold ${isNext ? 'text-primary' : 'text-muted-foreground'}`}>
                        {formatTime(p.time)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Settings */}
              <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Auto Azan</p>
                    <p className="text-xs text-muted-foreground">Notifikasi saat waktu shalat</p>
                  </div>
                  <button onClick={toggleEnabled}
                    className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? 'bg-primary' : 'bg-white/20'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? 'left-5.5 left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Pilih suara azan:</p>
                  <div className="flex flex-col gap-1.5">
                    {AZAN_OPTIONS.map((opt, i) => (
                      <button key={i} onClick={() => setAzanIdx(i)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${azanIdx === i ? 'bg-primary/20 border border-primary/40 text-primary' : 'bg-white/5 hover:bg-white/10'}`}>
                        <span>{opt.label}</span>
                        {azanIdx === i && <ChevronRight className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Azan overlay — appears when it's prayer time */}
      <AnimatePresence>
        {azanActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
            <motion.div
              initial={{ y: 30 }} animate={{ y: 0 }}
              className="relative glass border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              {/* Stars deco */}
              <div className="absolute top-4 left-6 text-white/20 text-xs">✦</div>
              <div className="absolute top-8 right-8 text-white/15 text-xs">✦</div>
              <div className="absolute bottom-12 left-8 text-white/10 text-xs">✦</div>

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                {PRAYER_ICONS[azanActive.key]}
              </motion.div>

              <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-2">Waktunya Shalat</p>
              <h2 className="font-serif text-4xl font-bold mb-1">{azanActive.name}</h2>
              <p className="font-mono text-primary text-xl font-bold mb-2">{formatTime(azanActive.time)}</p>
              <p className="text-sm text-white/50 mb-6 leading-relaxed">
                الله أكبر الله أكبر<br />
                <span className="text-xs">Allahu Akbar, Allahu Akbar</span>
              </p>

              {/* YouTube azan player */}
              <div className="rounded-2xl overflow-hidden mb-5 border border-white/10">
                <iframe
                  src={`https://www.youtube.com/embed/${AZAN_OPTIONS[azanIdx].ytId}?autoplay=1&rel=0&controls=1`}
                  allow="autoplay; encrypted-media"
                  className="w-full"
                  style={{ height: 160 }}
                  title="Azan"
                />
              </div>

              <button onClick={dismissAzan}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-semibold transition-colors">
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
