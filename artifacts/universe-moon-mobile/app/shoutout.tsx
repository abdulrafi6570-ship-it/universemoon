import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { useApi } from "@/hooks/useApi";

interface Shoutout { id: number; fromUser: string; toUser: string; message: string; reactions: Record<string, string[]>; createdAt: string; }

export default function ShoutoutScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { get, post } = useApi();
  const qc = useQueryClient();
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");
  const [posting, setPosting] = useState(false);
  const { data = [], isLoading, refetch } = useQuery<Shoutout[]>({ queryKey: ["shoutouts"], queryFn: () => get("/api/shoutouts") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function submit() {
    if (!user) { Alert.alert("Login dulu"); return; }
    if (!to.trim() || !msg.trim()) { Alert.alert("Isi semua field"); return; }
    setPosting(true);
    try {
      await post("/api/shoutouts", { fromUser: user.username, toUser: to.trim(), message: msg.trim() });
      setTo(""); setMsg("");
      qc.invalidateQueries({ queryKey: ["shoutouts"] });
    } catch (e: unknown) { Alert.alert("Gagal", e instanceof Error ? e.message : "Error"); }
    finally { setPosting(false); }
  }

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Shoutout</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {user && (
          <View style={s.postCard}>
            <Text style={s.label}>Kirimi seseorang shoutout!</Text>
            <TextInput style={s.input} placeholder="Kepada siapa?" placeholderTextColor={COLORS.textDim} value={to} onChangeText={setTo} />
            <TextInput style={[s.input, { minHeight: 60, textAlignVertical: "top" }]} placeholder="Pesanmu..." placeholderTextColor={COLORS.textDim} value={msg} onChangeText={setMsg} multiline />
            <Pressable style={[s.btn, posting && { opacity: 0.6 }]} onPress={submit} disabled={posting}>
              <Text style={s.btnText}>Kirim Shoutout</Text>
            </Pressable>
          </View>
        )}
        {data.map((so) => (
          <View key={so.id} style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="megaphone" size={16} color={COLORS.primary} />
              <Text style={s.from}>{so.fromUser}</Text>
              <Feather name="arrow-right" size={14} color={COLORS.textDim} />
              <Text style={s.to}>{so.toUser}</Text>
            </View>
            <Text style={s.message}>{so.message}</Text>
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
  postCard: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text, marginBottom: 10 },
  input: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#0a0a18" },
  card: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  from: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.primary },
  to: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.accent },
  message: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.text, lineHeight: 20 },
});
