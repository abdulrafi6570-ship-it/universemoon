import { useEffect, useState, useRef, useCallback } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

// Default: Jakarta, Indonesia (WIB UTC+7)
// Users in other cities can get roughly accurate times ±10 min
const COORDS = { lat: -6.2088, lng: 106.8456 };
const LOCATION_LABEL = 'Jakarta';

export interface PrayerEntry {
  key: string;
  name: string;
  time: Date;
}

export function usePrayerTimes() {
  const [times, setTimes] = useState<PrayerEntry[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerEntry | null>(null);
  const [azanActive, setAzanActive] = useState<PrayerEntry | null>(null);
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('azan_enabled') !== 'false'; } catch { return true; }
  });
  const lastTriggeredRef = useRef<string>('');

  const toggleEnabled = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem('azan_enabled', String(next)); } catch {}
      return next;
    });
  }, []);

  const buildTimes = useCallback((date: Date): PrayerEntry[] => {
    const coords = new Coordinates(COORDS.lat, COORDS.lng);
    const params = CalculationMethod.MuslimWorldLeague();
    params.madhab = Madhab.Shafi;
    const pt = new PrayerTimes(coords, date, params);
    return [
      { key: 'subuh',   name: 'Subuh',   time: pt.fajr },
      { key: 'dzuhur',  name: 'Dzuhur',  time: pt.dhuhr },
      { key: 'ashar',   name: 'Ashar',   time: pt.asr },
      { key: 'maghrib', name: 'Maghrib', time: pt.maghrib },
      { key: 'isya',    name: "Isya'",   time: pt.isha },
    ];
  }, []);

  useEffect(() => {
    const recalc = () => {
      const now = new Date();
      const entries = buildTimes(now);
      setTimes(entries);

      const upcoming = entries.filter(e => e.time > now);
      setNextPrayer(upcoming[0] ?? null);
    };

    recalc();

    const id = setInterval(() => {
      const now = new Date();
      const entries = buildTimes(now);

      const upcoming = entries.filter(e => e.time > now);
      setNextPrayer(upcoming[0] ?? null);

      if (!enabled) return;

      for (const p of entries) {
        const diffMs = Math.abs(now.getTime() - p.time.getTime());
        const triggerKey = `${p.key}-${now.toDateString()}`;
        if (diffMs < 90_000 && lastTriggeredRef.current !== triggerKey) {
          lastTriggeredRef.current = triggerKey;
          setAzanActive(p);
          break;
        }
      }
    }, 15_000);

    return () => clearInterval(id);
  }, [buildTimes, enabled]);

  return {
    times,
    nextPrayer,
    azanActive,
    dismissAzan: () => setAzanActive(null),
    enabled,
    toggleEnabled,
    location: LOCATION_LABEL,
  };
}
