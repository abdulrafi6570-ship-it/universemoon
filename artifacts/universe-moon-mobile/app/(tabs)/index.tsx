import { Ionicons, Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { useApi } from "@/hooks/useApi";

interface Stats {
  members: number;
  messages: number;
  photos: number;
  memories: number;
  songs: number;
  fanfics: number;
  daysSinceFounded: number;
}

interface Activity {
  type: string;
  icon: string;
  text: string;
  time: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return `${d}h lalu`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Selamat tengah malam";
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

function StatCard({ value, label, icon }: { value: number | string; label: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const QUICK_LINKS = [
  { icon: "musical-notes" as const, label: "Musik", href: "/music" },
  { icon: "trophy" as const, label: "Leaderboard", href: "/leaderboard" },
  { icon: "book" as const, label: "Memories", href: "/memories" },
  { icon: "happy" as const, label: "Moodboard", href: "/moodboard" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, guestName, logout } = useAuth();
  const { get } = useApi();

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => get("/api/stats"),
  });

  const { data: activity, isLoading: loadingActivity, refetch: refetchActivity } = useQuery<Activity[]>({
    queryKey: ["activity"],
    queryFn: () => get("/api/activity"),
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const displayName = user?.username || guestName || "Tamu";

  function onRefresh() {
    refetchStats();
    refetchActivity();
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.username}>{displayName}</Text>
        </View>
        <Pressable style={styles.avatarCircle} onPress={() => Alert.alert("Logout?")}>
          <Ionicons name="person" size={20} color={COLORS.primary} />
        </Pressable>
      </View>

      <View style={styles.heroBanner}>
        <Ionicons name="moon" size={32} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Universe Moon</Text>
          <Text style={styles.heroSub}>
            {stats ? `${stats.daysSinceFounded} hari bersama` : "Komunitas kita"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Statistik</Text>
      {loadingStats ? (
        <View style={styles.skeleton} />
      ) : (
        <View style={styles.statsGrid}>
          <StatCard value={stats?.members ?? 0} label="Anggota" icon="👥" />
          <StatCard value={stats?.messages ?? 0} label="Chat" icon="💬" />
          <StatCard value={stats?.photos ?? 0} label="Foto" icon="📸" />
          <StatCard value={stats?.memories ?? 0} label="Kenangan" icon="📖" />
          <StatCard value={stats?.songs ?? 0} label="Lagu" icon="🎵" />
          <StatCard value={stats?.fanfics ?? 0} label="Cerita" icon="📝" />
        </View>
      )}

      <Text style={styles.sectionTitle}>Jelajahi</Text>
      <View style={styles.quickRow}>
        {QUICK_LINKS.map((q) => (
          <Pressable key={q.label} style={styles.quickBtn} onPress={() => router.push(q.href as never)}>
            <Ionicons name={q.icon} size={22} color={COLORS.primary} />
            <Text style={styles.quickLabel}>{q.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Aktivitas Terbaru</Text>
      {loadingActivity ? (
        <View style={styles.skeleton} />
      ) : !activity?.length ? (
        <View style={styles.empty}>
          <Feather name="activity" size={28} color={COLORS.textDim} />
          <Text style={styles.emptyText}>Belum ada aktivitas</Text>
        </View>
      ) : (
        <View style={styles.activityList}>
          {activity.slice(0, 8).map((a, i) => (
            <View key={i} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityText}>{a.text}</Text>
                <Text style={styles.activityTime}>{timeAgo(a.time)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 80 }} />
    </ScrollView>
  );
}

import { Alert } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 20 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 8 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textMuted },
  username: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.text, letterSpacing: -0.3 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  heroBanner: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 18, padding: 18, marginBottom: 28,
  },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: COLORS.text },
  heroSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.textMuted, marginBottom: 12, letterSpacing: 0.3 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, minWidth: "28%",
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 16, padding: 14, alignItems: "center",
  },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20, color: COLORS.text },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  quickBtn: {
    flex: 1, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 6,
  },
  quickLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: COLORS.textMuted },
  activityList: { gap: 1, marginBottom: 16 },
  activityItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  activityDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 6,
  },
  activityText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.text, lineHeight: 18 },
  activityTime: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  skeleton: { height: 100, backgroundColor: COLORS.bgCard, borderRadius: 16, marginBottom: 28 },
  empty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim },
});
