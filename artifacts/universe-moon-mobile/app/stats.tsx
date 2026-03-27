import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface Stats { members: number; messages: number; photos: number; memories: number; songs: number; fanfics: number; memes: number; stories: number; shoutouts: number; daysSinceFounded: number; }

const ITEMS = [
  { key: "members" as const, label: "Anggota", icon: "👥", color: COLORS.primary },
  { key: "messages" as const, label: "Chat", icon: "💬", color: COLORS.accent },
  { key: "photos" as const, label: "Foto", icon: "📸", color: COLORS.green },
  { key: "memories" as const, label: "Kenangan", icon: "📖", color: COLORS.yellow },
  { key: "songs" as const, label: "Lagu", icon: "🎵", color: COLORS.primary },
  { key: "fanfics" as const, label: "Cerita", icon: "✍️", color: COLORS.accent },
  { key: "memes" as const, label: "Meme", icon: "😂", color: COLORS.green },
  { key: "stories" as const, label: "Story", icon: "⭐", color: COLORS.yellow },
  { key: "shoutouts" as const, label: "Shoutout", icon: "📢", color: COLORS.red },
];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const { data, isLoading, refetch } = useQuery<Stats>({ queryKey: ["stats"], queryFn: () => get("/api/stats") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Statistik</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {data && (
          <View style={s.heroBanner}>
            <Ionicons name="moon" size={32} color={COLORS.primary} />
            <View>
              <Text style={s.heroNum}>{data.daysSinceFounded}</Text>
              <Text style={s.heroLabel}>hari bersama</Text>
            </View>
          </View>
        )}
        <View style={s.grid}>
          {ITEMS.map((item) => (
            <View key={item.key} style={[s.statCard, { borderColor: item.color + "33" }]}>
              <Text style={s.statIcon}>{item.icon}</Text>
              <Text style={[s.statVal, { color: item.color }]}>{data?.[item.key] ?? "—"}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: COLORS.text, flex: 1, textAlign: "center" },
  heroBanner: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 20, marginBottom: 20 },
  heroNum: { fontFamily: "Inter_700Bold", fontSize: 36, color: COLORS.primary },
  heroLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textMuted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "30%", flex: 1, minWidth: "28%", backgroundColor: COLORS.bgCard, borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 4 },
  statIcon: { fontSize: 22 },
  statVal: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
});
