import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Music, ChevronDown, ChevronUp } from 'lucide-react';
import { useMusicStore } from '@/hooks/use-music';

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

export function MusicBar() {
  const { currentSong, isPlaying, stop, togglePlay, setIsPlaying } = useMusicStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  const ytId = currentSong?.url ? getYouTubeId(currentSong.url) : null;
  const isYT = !!ytId;
  const isFile = !!currentSong?.fileUrl && !isYT;

  // Sync audio element with isPlaying state
  useEffect(() => {
    if (!isFile) return;
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isFile]);

  // Reset audio when song changes
  useEffect(() => {
    if (!isFile) return;
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) audioRef.current.play().catch(() => {});
    }
  }, [currentSong?.id]);

  if (!currentSong) return null;

  const thumb = ytId
    ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
    : null;

  return (
    <AnimatePresence>
      <motion.div
        key="music-bar"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="fixed bottom-[72px] md:bottom-4 left-0 right-0 z-40 px-3 md:px-4 pointer-events-none"
      >
        <div className="max-w-sm mx-auto pointer-events-auto">
          {/* YouTube player — shown when not collapsed */}
          {isYT && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="rounded-t-2xl overflow-hidden border border-white/15 border-b-0"
            >
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                allow="autoplay; encrypted-media"
                className="w-full"
                style={{ height: 180 }}
                title={currentSong.title}
              />
            </motion.div>
          )}

          {/* Mini bar */}
          <div className={`glass border border-white/15 shadow-2xl flex items-center gap-3 px-3 py-2.5 ${isYT && !collapsed ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
            {/* Thumbnail / icon */}
            {thumb ? (
              <img src={thumb} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-white/60" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">{currentSong.title}</p>
              {currentSong.artist && (
                <p className="text-[10px] text-white/50 truncate">{currentSong.artist}</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              {/* File: play/pause */}
              {isFile && (
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              )}

              {/* YouTube: collapse/expand */}
              {isYT && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Stop */}
              <button
                onClick={stop}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hidden audio for file playback */}
          {isFile && (
            <audio
              ref={audioRef}
              src={currentSong.fileUrl}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
