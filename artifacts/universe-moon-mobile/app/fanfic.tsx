import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface Fanfic { id: number; title: string; author: string; genre: string; synopsis: string; views: number; likes: string[]; createdAt: string; }

export default function FanficScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const { data = [], isLoading, refetch } = useQuery<Fanfic[]>({ queryKey: ["fanfics"], queryFn: () => get("/api/fanfics") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Fanfic & Cerita</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {!data.length && !isLoading && (
          <View style={s.empty}><Feather name="book-open" size={36} color={COLORS.textDim} /><Text style={s.emptyText}>Belum ada cerita. Tambahkan di website!</Text></View>
        )}
        {data.map((f) => (
          <View key={f.id} style={s.card}>
            <View style={s.cardTop}>
              <Text style={s.genre}>{f.genre}</Text>
              <View style={s.meta}>
                <Feather name="eye" size={11} color={COLORS.textDim} /><Text style={s.metaText}>{f.views}</Text>
                <Ionicons name="heart" size={11} color={COLORS.red} /><Text style={s.metaText}>{f.likes?.length ?? 0}</Text>
              </View>
            </View>
            <Text style={s.fanTitle}>{f.title}</Text>
            <Text style={s.author}>oleh {f.author}</Text>
            {f.synopsis && <Text style={s.synopsis} numberOfLines={3}>{f.synopsis}</Text>}
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
  card: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  genre: { fontFamily: "Inter_500Medium", fontSize: 11, color: COLORS.primary, backgroundColor: COLORS.primaryDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textDim },
  fanTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: COLORS.text, marginBottom: 4 },
  author: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  synopsis: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim, textAlign: "center" },
});
