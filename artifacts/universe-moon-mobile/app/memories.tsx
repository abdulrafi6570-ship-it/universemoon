import { Feather, Ionicons } from "@expo/vector-icons";
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

interface Memory {
  id: number;
  title: string;
  caption: string;
  date: string;
  uploadedBy: string;
  mediaUrl: string | null;
  createdAt: string;
}

export default function MemoriesScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const { data = [], isLoading, refetch } = useQuery<Memory[]>({
    queryKey: ["memories"],
    queryFn: () => get("/api/memories"),
  });
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Memories</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20, gap: 12 }}
      >
        {!data.length && !isLoading ? (
          <View style={s.empty}><Feather name="book" size={36} color={COLORS.textDim} /><Text style={s.emptyText}>Belum ada kenangan</Text></View>
        ) : data.map((m) => (
          <View key={m.id} style={s.card}>
            <View style={s.dateTag}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.primary} />
              <Text style={s.dateText}>{m.date || m.createdAt?.split("T")[0]}</Text>
            </View>
            <Text style={s.memTitle}>{m.title || m.caption}</Text>
            {m.caption && m.title && <Text style={s.memCaption}>{m.caption}</Text>}
            <Text style={s.memBy}>oleh {m.uploadedBy}</Text>
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
  card: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, gap: 6 },
  dateTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.primary },
  memTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text },
  memCaption: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  memBy: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textDim },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim },
});
