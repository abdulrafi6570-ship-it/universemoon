import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface Rule { id: number; category: string; title: string; content: string; order: number; }

export default function RulesScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const { data = [], isLoading, refetch } = useQuery<Rule[]>({ queryKey: ["rules"], queryFn: () => get("/api/rules") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const grouped = data.reduce<Record<string, Rule[]>>((acc, r) => { (acc[r.category] ??= []).push(r); return acc; }, {});

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Peraturan</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {!data.length && !isLoading && (
          <View style={s.empty}><Feather name="book" size={36} color={COLORS.textDim} /><Text style={s.emptyText}>Belum ada peraturan</Text></View>
        )}
        {Object.entries(grouped).map(([cat, rules]) => (
          <View key={cat} style={{ marginBottom: 20 }}>
            <Text style={s.catTitle}>{cat}</Text>
            {rules.map((r, i) => (
              <View key={r.id} style={s.ruleCard}>
                <View style={s.num}><Text style={s.numText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ruleTitle}>{r.title}</Text>
                  <Text style={s.ruleContent}>{r.content}</Text>
                </View>
              </View>
            ))}
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
  catTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.textMuted, marginBottom: 10, letterSpacing: 0.3 },
  ruleCard: { flexDirection: "row", gap: 12, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primaryDim, alignItems: "center", justifyContent: "center" },
  numText: { fontFamily: "Inter_700Bold", fontSize: 13, color: COLORS.primary },
  ruleTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text, marginBottom: 4 },
  ruleContent: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim },
});
