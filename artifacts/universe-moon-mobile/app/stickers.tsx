import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface Sticker { id: number; name: string; code: string; emoji: string; category: string; addedBy: string; }

export default function StickersScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const { data = [], isLoading, refetch } = useQuery<Sticker[]>({ queryKey: ["custom-stickers"], queryFn: () => get("/api/custom-stickers") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Custom Stiker</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {!data.length && !isLoading && (
          <View style={s.empty}><Ionicons name="happy-outline" size={36} color={COLORS.textDim} /><Text style={s.emptyText}>Belum ada stiker. Admin akan menambahkan.</Text></View>
        )}
        <View style={s.grid}>
          {data.map((st) => (
            <View key={st.id} style={s.card}>
              <Text style={{ fontSize: 36 }}>{st.emoji}</Text>
              <Text style={s.name}>{st.name}</Text>
              <Text style={s.code}>{st.code}</Text>
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
  card: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 14, alignItems: "center", gap: 6, width: "30%", flex: 1 },
  name: { fontFamily: "Inter_500Medium", fontSize: 12, color: COLORS.text, textAlign: "center" },
  code: { fontFamily: "Inter_400Regular", fontSize: 10, color: COLORS.textDim },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim, textAlign: "center" },
});
