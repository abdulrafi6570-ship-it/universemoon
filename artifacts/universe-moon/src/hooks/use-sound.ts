import { create } from 'zustand';

interface SoundState {
  soundEnabled: boolean;
  toggleSound: () => void;
  playSfx: (type: 'message' | 'click' | 'notification' | 'error') => void;
}

export const useSound = create<SoundState>((set, get) => ({
  soundEnabled: true,
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  playSfx: (type) => {
    if (!get().soundEnabled) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + duration);
      };

      switch (type) {
        case 'click':
          playTone(600, 'sine', 0.1, 0.05);
          break;
        case 'message':
          playTone(440, 'sine', 0.1, 0.05);
          setTimeout(() => playTone(880, 'sine', 0.2, 0.05), 100);
          break;
        case 'notification':
          playTone(880, 'triangle', 0.1, 0.1);
          setTimeout(() => playTone(1100, 'triangle', 0.3, 0.1), 100);
          break;
        case 'error':
          playTone(200, 'sawtooth', 0.3, 0.1);
          setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.1), 150);
          break;
      }
    } catch (e) {
      // Ignore audio errors (e.g., user hasn't interacted with document yet)
    }
  }
}));
