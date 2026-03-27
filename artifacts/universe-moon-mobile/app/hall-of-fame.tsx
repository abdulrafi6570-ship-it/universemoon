import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import {
  Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface HallData {
  topXp: { username: string; xp: number; avatarUrl: string | null }[];
  topStreak: { username: string; streak: number; avatarUrl: string | null }[];
  topGames: { username: string; wins: number }[];
}

export default function HallOfFameScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const { data, isLoading, refetch } = useQuery<HallData>({
    queryKey: ["hall-of-fame"],
    queryFn: () => get("/api/hall-of-fame"),
  });
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const medals = ["🥇", "🥈", "🥉"];

  function Section({ title, items, valueKey, suffix }: { title: string; items: Record<string, string | number | null>[]; valueKey: string; suffix: string }) {
    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>{title}</Text>
        {items.slice(0, 3).map((item, i) => (
          <View key={i} style={s.row}>
            <Text style={s.medal}>{medals[i]}</Text>
            <Text style={s.name}>{item.username as string}</Text>
            <Text style={s.val}>{item[valueKey] as string} {suffix}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Hall of Fame</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        <View style={s.banner}>
          <Ionicons name="trophy" size={40} color={COLORS.yellow} />
          <Text style={s.bannerText}>Hall of Fame</Text>
          <Text style={s.bannerSub}>Top performers Universe Moon</Text>
        </View>
        {data && (
          <>
            <Section title="Top XP" items={data.topXp} valueKey="xp" suffix="XP" />
            <Section title="Top Streak" items={data.topStreak} valueKey="streak" suffix="hari" />
            {data.topGames.length > 0 && (
              <Section title="Top Games" items={data.topGames} valueKey="wins" suffix="wins" />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: COLORS.text, flex: 1, textAlign: "center" },
  banner: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 24, alignItems: "center", marginBottom: 24, gap: 8 },
  bannerText: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.yellow },
  bannerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textMuted },
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.textMuted, marginBottom: 10, letterSpacing: 0.3 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  medal: { fontSize: 22 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text, flex: 1 },
  val: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.primary },
});
