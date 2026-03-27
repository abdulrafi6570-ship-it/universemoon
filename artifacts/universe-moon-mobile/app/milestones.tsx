import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface Milestone { id: number; title: string; description: string; date: string; icon: string; }

export default function MilestonesScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const { data = [], isLoading, refetch } = useQuery<Milestone[]>({ queryKey: ["milestones"], queryFn: () => get("/api/milestones") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Milestones</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {!data.length && !isLoading && (
          <View style={s.empty}><Feather name="flag" size={36} color={COLORS.textDim} /><Text style={s.emptyText}>Belum ada milestone</Text></View>
        )}
        {data.map((m, i) => (
          <View key={m.id} style={s.row}>
            <View style={s.timelineLeft}>
              <View style={s.iconCircle}><Text style={{ fontSize: 18 }}>{m.icon || "⭐"}</Text></View>
              {i < data.length - 1 && <View style={s.line} />}
            </View>
            <View style={s.card}>
              <Text style={s.mDate}>{m.date}</Text>
              <Text style={s.mTitle}>{m.title}</Text>
              {m.description && <Text style={s.mDesc}>{m.description}</Text>}
            </View>
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
  row: { flexDirection: "row", gap: 14, marginBottom: 4 },
  timelineLeft: { alignItems: "center", width: 44 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  line: { flex: 1, width: 2, backgroundColor: COLORS.border, marginVertical: 4 },
  card: { flex: 1, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 14 },
  mDate: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.primary, marginBottom: 4 },
  mTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  mDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted, marginTop: 4, lineHeight: 18 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim },
});
