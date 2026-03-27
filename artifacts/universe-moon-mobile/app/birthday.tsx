import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface Birthday { id: number; username: string; date: string; }

function daysTill(dateStr: string) {
  const now = new Date();
  const [, m, d] = dateStr.split("-").map(Number);
  const next = new Date(now.getFullYear(), m - 1, d);
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  return Math.ceil((next.getTime() - now.getTime()) / 86400000);
}

export default function BirthdayScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const { data = [], isLoading, refetch } = useQuery<Birthday[]>({ queryKey: ["birthdays"], queryFn: () => get("/api/birthdays") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const sorted = [...data].sort((a, b) => daysTill(a.date) - daysTill(b.date));

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Ulang Tahun</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {!sorted.length && !isLoading && (
          <View style={s.empty}><Feather name="gift" size={36} color={COLORS.textDim} /><Text style={s.emptyText}>Belum ada data ulang tahun</Text></View>
        )}
        {sorted.map((b) => {
          const days = daysTill(b.date);
          const isToday = days === 0;
          return (
            <View key={b.id} style={[s.card, isToday && s.cardToday]}>
              <Text style={{ fontSize: 28 }}>{isToday ? "🎂" : "🎁"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{b.username}</Text>
                <Text style={s.date}>{b.date}</Text>
              </View>
              <View style={[s.badge, isToday && s.badgeToday]}>
                <Text style={[s.badgeText, isToday && { color: COLORS.yellow }]}>
                  {isToday ? "Hari ini!" : `${days} hari lagi`}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: COLORS.text, flex: 1, textAlign: "center" },
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardToday: { borderColor: COLORS.yellow + "88", backgroundColor: "rgba(251,191,36,0.08)" },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text },
  date: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted },
  badge: { backgroundColor: COLORS.bgCard, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeToday: { backgroundColor: "rgba(251,191,36,0.15)" },
  badgeText: { fontFamily: "Inter_500Medium", fontSize: 12, color: COLORS.textMuted },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim },
});
