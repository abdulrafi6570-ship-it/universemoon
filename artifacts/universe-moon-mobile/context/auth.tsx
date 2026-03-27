import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
}

interface AuthContextType {
  user: AuthUser | null;
  sessionToken: string | null;
  guestName: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (token: string, username: string, password: string) => Promise<void>;
  loginAsGuest: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const stored = await AsyncStorage.getItem("um_session");
      if (stored) {
        const { token, user: u } = JSON.parse(stored);
        setSessionToken(token);
        setUser(u);
      } else {
        const guest = await AsyncStorage.getItem("um_guest");
        if (guest) setGuestName(guest);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login gagal");
    setSessionToken(data.sessionToken);
    setUser(data.user);
    setGuestName(null);
    await AsyncStorage.setItem("um_session", JSON.stringify({ token: data.sessionToken, user: data.user }));
    await AsyncStorage.removeItem("um_guest");
    fetch(`${BASE_URL}/api/users/seen`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.sessionToken}` },
      body: JSON.stringify({ username: data.user.username }),
    }).catch(() => {});
  }

  async function register(token: string, username: string, password: string) {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registrasi gagal");
  }

  async function loginAsGuest(name: string) {
    const gName = `Tamu_${name}`;
    setGuestName(gName);
    setUser(null);
    setSessionToken(null);
    await AsyncStorage.setItem("um_guest", gName);
    await AsyncStorage.removeItem("um_session");
  }

  async function logout() {
    if (sessionToken) {
      fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      }).catch(() => {});
    }
    setUser(null);
    setSessionToken(null);
    setGuestName(null);
    await AsyncStorage.removeItem("um_session");
    await AsyncStorage.removeItem("um_guest");
  }

  return (
    <AuthContext.Provider value={{ user, sessionToken, guestName, loading, login, register, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
