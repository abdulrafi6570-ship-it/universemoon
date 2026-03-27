import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";

const GAMES = [
  { icon: "👤", name: "Imposter", desc: "Temukan penipu di antara kalian", href: "/game/imposter" },
  { icon: "🐺", name: "Werewolf", desc: "Serigala vs warga desa", href: "/game/werewolf" },
  { icon: "🧛", name: "Dracula", desc: "Sang drakula mengintai", href: "/game/dracula" },
  { icon: "🎲", name: "Ludo", desc: "Papan ludo klasik", href: "/game/ludo" },
];

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Mini Games</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, gap: 14 }}>
        <View style={s.banner}>
          <Ionicons name="game-controller" size={36} color={COLORS.accent} />
          <Text style={s.bannerText}>Pilih permainan</Text>
          <Text style={s.bannerSub}>Games untuk seru-seruan bersama</Text>
        </View>
        {GAMES.map((g) => (
          <Pressable
            key={g.name}
            style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}
            onPress={() => router.push(g.href as never)}
          >
            <Text style={{ fontSize: 36 }}>{g.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.gameName}>{g.name}</Text>
              <Text style={s.gameDesc}>{g.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textDim} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: COLORS.text, flex: 1, textAlign: "center" },
  banner: { backgroundColor: COLORS.accentDim, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 24, alignItems: "center", gap: 8 },
  bannerText: { fontFamily: "Inter_700Bold", fontSize: 20, color: COLORS.text },
  bannerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textMuted },
  card: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 18 },
  gameName: { fontFamily: "Inter_700Bold", fontSize: 17, color: COLORS.text },
  gameDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
});
