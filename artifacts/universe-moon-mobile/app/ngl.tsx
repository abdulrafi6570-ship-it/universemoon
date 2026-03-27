import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface NglMsg { id: number; content: string; reactions: Record<string, number>; createdAt: string; }

export default function NglScreen() {
  const insets = useSafeAreaInsets();
  const { get, post } = useApi();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const { data = [], isLoading, refetch } = useQuery<NglMsg[]>({ queryKey: ["ngl"], queryFn: () => get("/api/ngl") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function send() {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await post("/api/ngl", { content: msg.trim() });
      setMsg("");
      qc.invalidateQueries({ queryKey: ["ngl"] });
    } catch (e: unknown) { Alert.alert("Gagal kirim"); }
    finally { setSending(false); }
  }

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>NGL</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        <View style={s.sendCard}>
          <Feather name="eye-off" size={20} color={COLORS.textMuted} />
          <Text style={s.sendLabel}>Kirim pesan anonim</Text>
          <TextInput style={s.input} placeholder="Jujur aja, anonim kok..." placeholderTextColor={COLORS.textDim} value={msg} onChangeText={setMsg} multiline maxLength={500} />
          <Pressable style={[s.btn, sending && { opacity: 0.6 }]} onPress={send} disabled={sending}>
            <Text style={s.btnText}>Kirim Anonim</Text>
          </Pressable>
        </View>
        {data.map((n) => (
          <View key={n.id} style={s.card}>
            <Feather name="message-square" size={14} color={COLORS.textMuted} />
            <Text style={s.msgText}>{n.content}</Text>
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
  sendCard: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, marginBottom: 20, gap: 10, alignItems: "center" },
  sendLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  input: { width: "100%", backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14, minHeight: 60, textAlignVertical: "top" },
  btn: { width: "100%", backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#0a0a18" },
  card: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  msgText: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.text, flex: 1, lineHeight: 20 },
});
