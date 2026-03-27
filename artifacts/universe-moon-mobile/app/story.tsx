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

interface Story { id: number; username: string; content: string; bgColor: string; createdAt: string; expiresAt: string; }

const BG_COLORS = [COLORS.primaryDim, COLORS.accentDim, "rgba(52,211,153,0.15)", "rgba(251,191,36,0.15)"];

export default function StoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { get, post } = useApi();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [posting, setPosting] = useState(false);
  const { data = [], isLoading, refetch } = useQuery<Story[]>({ queryKey: ["stories"], queryFn: () => get("/api/stories") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function submit() {
    if (!user) { Alert.alert("Login dulu"); return; }
    if (!content.trim()) { Alert.alert("Isi story kamu"); return; }
    setPosting(true);
    try {
      await post("/api/stories", { username: user.username, content: content.trim(), bgColor });
      setContent("");
      qc.invalidateQueries({ queryKey: ["stories"] });
    } catch (e: unknown) { Alert.alert("Gagal", e instanceof Error ? e.message : "Error"); }
    finally { setPosting(false); }
  }

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Story</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {user && (
          <View style={s.postCard}>
            <TextInput style={s.input} placeholder="Lagi ngapain? (24 jam)" placeholderTextColor={COLORS.textDim} value={content} onChangeText={setContent} multiline maxLength={280} />
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              {BG_COLORS.map((c) => (
                <Pressable key={c} style={[s.colorBtn, { backgroundColor: c }, bgColor === c && s.colorBtnActive]} onPress={() => setBgColor(c)} />
              ))}
            </View>
            <Pressable style={[s.btn, posting && { opacity: 0.6 }]} onPress={submit} disabled={posting}>
              <Text style={s.btnText}>Post Story</Text>
            </Pressable>
          </View>
        )}
        {!data.length && !isLoading && (
          <View style={s.empty}><Feather name="sun" size={36} color={COLORS.textDim} /><Text style={s.emptyText}>Belum ada story hari ini</Text></View>
        )}
        <View style={s.grid}>
          {data.map((st) => (
            <View key={st.id} style={[s.storyCard, { backgroundColor: st.bgColor || COLORS.bgCard }]}>
              <Text style={s.storyUser}>{st.username}</Text>
              <Text style={s.storyContent}>{st.content}</Text>
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
  input: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14, minHeight: 70, textAlignVertical: "top", marginBottom: 10 },
  colorBtn: { width: 30, height: 30, borderRadius: 15 },
  colorBtnActive: { borderWidth: 2, borderColor: COLORS.text },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#0a0a18" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  storyCard: { width: "47%", borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 14, minHeight: 100, justifyContent: "flex-end" },
  storyUser: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.primary, marginBottom: 4 },
  storyContent: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.text },
  empty: { alignItems: "center", paddingTop: 40, gap: 12, marginBottom: 20 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim },
});
