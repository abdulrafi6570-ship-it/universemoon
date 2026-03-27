import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";

const GAME_INFO: Record<string, { icon: string; name: string; desc: string }> = {
  imposter: { icon: "👤", name: "Imposter", desc: "Temukan penipu di antara kalian. Satu orang jadi imposter dan harus berbohong tanpa ketahuan!" },
  werewolf: { icon: "🐺", name: "Werewolf", desc: "Serigala vs warga desa. Bicaralah, diskusi, dan vote untuk mengungkap siapa serigalanya!" },
  dracula: { icon: "🧛", name: "Dracula", desc: "Drakula mengintai di malam hari. Dapatkah warga bertahan hingga pagi?" },
  ludo: { icon: "🎲", name: "Ludo", desc: "Papan ludo klasik bersama teman. Siapa yang sampai rumah duluan?" },
};

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = GAME_INFO[id as string] || { icon: "🎮", name: "Game", desc: "Mini game seru bersama!" };
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>{game.name}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={s.content}>
        <Text style={{ fontSize: 72 }}>{game.icon}</Text>
        <Text style={s.gameName}>{game.name}</Text>
        <Text style={s.gameDesc}>{game.desc}</Text>
        <View style={s.comingSoon}>
          <Ionicons name="construct-outline" size={24} color={COLORS.textMuted} />
          <Text style={s.comingText}>Mode game akan segera hadir!</Text>
          <Text style={s.comingSub}>Untuk sementara, mainkan via WA group 🌙</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: COLORS.text, flex: 1, textAlign: "center" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  gameName: { fontFamily: "Inter_700Bold", fontSize: 28, color: COLORS.text },
  gameDesc: { fontFamily: "Inter_400Regular", fontSize: 15, color: COLORS.textMuted, textAlign: "center", lineHeight: 22 },
  comingSoon: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 24, alignItems: "center", gap: 10, marginTop: 16 },
  comingText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.textMuted },
  comingSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim, textAlign: "center" },
});
