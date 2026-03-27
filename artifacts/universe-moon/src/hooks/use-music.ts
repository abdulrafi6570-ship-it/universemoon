import { create } from 'zustand';

interface Song {
  id: number;
  title: string;
  artist?: string;
  url?: string;
  fileUrl?: string;
  genre?: string;
}

interface MusicState {
  currentSong: Song | null;
  isPlaying: boolean;
  play: (song: Song) => void;
  stop: () => void;
  togglePlay: () => void;
  setIsPlaying: (v: boolean) => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  play: (song) => set({ currentSong: song, isPlaying: true }),
  stop: () => set({ currentSong: null, isPlaying: false }),
  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),
  setIsPlaying: (v) => set({ isPlaying: v }),
}));
