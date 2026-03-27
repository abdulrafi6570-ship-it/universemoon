import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { useApi } from "@/hooks/useApi";

interface Mood { id: number; username: string; emoji: string; text: string; color: string; createdAt: string; }

const EMOJIS = ["😊", "😎", "😔", "🥰", "😤", "🤩", "😴", "🥲", "✨", "🌙", "🔥", "💫"];
const MOOD_COLORS = [COLORS.primary, COLORS.accent, COLORS.green, COLORS.yellow, COLORS.red];

export default function MoodboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { get, post } = useApi();
  const qc = useQueryClient();
  const [emoji, setEmoji] = useState("😊");
  const [text, setText] = useState("");
  const [color, setColor] = useState(COLORS.primary);
  const [posting, setPosting] = useState(false);
  const { data = [], isLoading, refetch } = useQuery<Mood[]>({ queryKey: ["moods"], queryFn: () => get("/api/moods") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function submit() {
    if (!user || !text.trim()) { Alert.alert("Isi mood kamu dulu"); return; }
    setPosting(true);
    try {
      await post("/api/moods", { username: user.username, emoji, text: text.trim(), color });
      setText("");
      qc.invalidateQueries({ queryKey: ["moods"] });
    } catch (e: unknown) { Alert.alert("Gagal", e instanceof Error ? e.message : "Error"); }
    finally { setPosting(false); }
  }

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Moodboard</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {user && (
          <View style={s.postCard}>
            <Text style={s.postLabel}>Mood kamu hari ini?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {EMOJIS.map((e) => (
                  <Pressable key={e} style={[s.emojiBtn, emoji === e && s.emojiBtnActive]} onPress={() => setEmoji(e)}>
                    <Text style={{ fontSize: 24 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              {MOOD_COLORS.map((c) => (
                <Pressable key={c} style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotActive]} onPress={() => setColor(c)} />
              ))}
            </View>
            <TextInput style={s.input} placeholder="Lagi ngerasa apa?" placeholderTextColor={COLORS.textDim} value={text} onChangeText={setText} />
            <Pressable style={[s.btn, posting && { opacity: 0.6 }]} onPress={submit} disabled={posting}>
              <Text style={s.btnText}>Post Mood</Text>
            </Pressable>
          </View>
        )}
        <View style={s.grid}>
          {data.map((m) => (
            <View key={m.id} style={[s.moodCard, { borderColor: m.color + "44" }]}>
              <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
              <Text style={s.moodText}>{m.text}</Text>
              <Text style={s.moodBy}>{m.username}</Text>
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
  postCard: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, marginBottom: 20 },
  postLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  emojiBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgCard, alignItems: "center", justifyContent: "center" },
  emojiBtnActive: { backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.border },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 2, borderColor: COLORS.text },
  input: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 10 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#0a0a18" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moodCard: { width: "47%", backgroundColor: COLORS.bgCard, borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 6 },
  moodText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.text, textAlign: "center" },
  moodBy: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
});
