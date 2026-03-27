import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { Dimensions, Image, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface Meme { id: number; imageUrl: string; caption: string; uploadedBy: string; reactions: Record<string, string[]>; createdAt: string; }
const W = (Dimensions.get("window").width - 44) / 2;

export default function MemeScreen() {
  const insets = useSafeAreaInsets();
  const { get, baseUrl } = useApi();
  const { data = [], isLoading, refetch } = useQuery<Meme[]>({ queryKey: ["memes"], queryFn: () => get("/api/memes") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Meme Board</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {!data.length && !isLoading && (
          <View style={s.empty}><Feather name="image" size={36} color={COLORS.textDim} /><Text style={s.emptyText}>Belum ada meme. Tambah di website!</Text></View>
        )}
        <View style={s.grid}>
          {data.map((m) => (
            <View key={m.id} style={s.card}>
              <Image source={{ uri: m.imageUrl.startsWith("http") ? m.imageUrl : `${baseUrl}${m.imageUrl}` }} style={s.img} resizeMode="cover" />
              {m.caption && <Text style={s.caption} numberOfLines={2}>{m.caption}</Text>}
              <Text style={s.by}>{m.uploadedBy}</Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: W, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, overflow: "hidden" },
  img: { width: W, height: W },
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.text, padding: 8 },
  by: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted, paddingHorizontal: 8, paddingBottom: 8 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim, textAlign: "center" },
});
