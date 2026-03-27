import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  role: string;
  avatarUrl?: string;
  xp?: number;
  level?: number;
  isBanned?: boolean;
}

interface AuthState {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setGuest: (status: boolean) => void;
  setLoading: (status: boolean) => void;
  logoutLocal: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isGuest: false,
  isLoading: true,
  setUser: (user) => {
    if (user) {
      localStorage.removeItem('um_guest');
      set({ user, isGuest: false, isLoading: false });
    } else {
      set({ user: null, isLoading: false });
    }
  },
  setGuest: (status) => {
    if (status) {
      localStorage.setItem('um_guest', 'true');
      set({ user: { id: 0, username: 'Guest', role: 'guest', xp: 0, level: 1 }, isGuest: true, isLoading: false });
    } else {
      localStorage.removeItem('um_guest');
      set({ isGuest: false, user: null });
    }
  },
  setLoading: (status) => set({ isLoading: status }),
  logoutLocal: () => {
    localStorage.removeItem('um_guest');
    set({ user: null, isGuest: false, isLoading: false });
  },
  initAuth: async () => {
    // Check if guest
    if (localStorage.getItem('um_guest') === 'true') {
      set({ user: { id: 0, username: 'Guest', role: 'guest', xp: 0, level: 1 }, isGuest: true, isLoading: false });
      return;
    }
    // Try to restore session from cookie
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const user = await res.json();
        set({ user, isGuest: false, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));

export type { User };
