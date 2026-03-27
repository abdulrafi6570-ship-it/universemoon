import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface XpEntry { username: string; xp: number; avatarUrl: string | null; }
interface GameEntry { username: string; game: string; wins: number; }

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const [tab, setTab] = useState<"xp" | "games">("xp");

  const { data: xpData = [], isLoading: xpLoading, refetch: refetchXp } = useQuery<XpEntry[]>({
    queryKey: ["leaderboard-xp"],
    queryFn: () => get("/api/leaderboard"),
  });

  const { data: gamesData = [], isLoading: gamesLoading, refetch: refetchGames } = useQuery<GameEntry[]>({
    queryKey: ["leaderboard-games"],
    queryFn: () => get("/api/leaderboard/games"),
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Leaderboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.tabs}>
        {(["xp", "games"] as const).map((t) => (
          <Pressable key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === "xp" ? "XP" : "Game Wins"}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={tab === "xp" ? xpLoading : gamesLoading} onRefresh={tab === "xp" ? refetchXp : refetchGames} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20, gap: 10 }}
      >
        {tab === "xp" ? xpData.map((e, i) => (
          <View key={e.username} style={[s.row, i === 0 && { borderColor: COLORS.primary }]}>
            <Text style={s.medal}>{medals[i] ?? `#${i + 1}`}</Text>
            <Text style={s.name}>{e.username}</Text>
            <View style={s.badge}>
              <Ionicons name="star" size={12} color={COLORS.yellow} />
              <Text style={s.xpText}>{e.xp} XP</Text>
            </View>
          </View>
        )) : gamesData.map((e, i) => (
          <View key={`${e.username}-${e.game}`} style={s.row}>
            <Text style={s.medal}>{medals[i] ?? `#${i + 1}`}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{e.username}</Text>
              <Text style={s.gameName}>{e.game}</Text>
            </View>
            <Text style={s.winText}>{e.wins} wins</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: COLORS.text, flex: 1, textAlign: "center" },
  tabs: { flexDirection: "row", margin: 16, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 9 },
  tabBtnActive: { backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.border },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14 },
  medal: { fontSize: 22 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text, flex: 1 },
  gameName: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primaryDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  xpText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.primary },
  winText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.green },
});
