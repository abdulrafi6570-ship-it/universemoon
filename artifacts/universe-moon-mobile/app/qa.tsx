import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { useApi } from "@/hooks/useApi";

interface QA { id: number; targetMember: string; question: string; answer: string | null; isAnonymous: boolean; askedBy: string; createdAt: string; }

export default function QAScreen() {
  const insets = useSafeAreaInsets();
  const { user, guestName } = useAuth();
  const { get, post } = useApi();
  const qc = useQueryClient();
  const [target, setTarget] = useState("");
  const [question, setQuestion] = useState("");
  const [posting, setPosting] = useState(false);
  const { data = [], isLoading, refetch } = useQuery<QA[]>({ queryKey: ["qa"], queryFn: () => get("/api/qa") });
  const asker = user?.username || guestName || "Tamu";
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function submit() {
    if (!target.trim() || !question.trim()) { Alert.alert("Isi target dan pertanyaan"); return; }
    setPosting(true);
    try {
      await post("/api/qa", { targetMember: target.trim(), question: question.trim(), askedBy: asker, isAnonymous: !user });
      setTarget(""); setQuestion("");
      qc.invalidateQueries({ queryKey: ["qa"] });
    } catch (e: unknown) { Alert.alert("Gagal", e instanceof Error ? e.message : "Error"); }
    finally { setPosting(false); }
  }

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Q&A</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        <View style={s.postCard}>
          <TextInput style={s.input} placeholder="Tanya kepada siapa?" placeholderTextColor={COLORS.textDim} value={target} onChangeText={setTarget} />
          <TextInput style={[s.input, { minHeight: 60, textAlignVertical: "top" }]} placeholder="Pertanyaanmu..." placeholderTextColor={COLORS.textDim} value={question} onChangeText={setQuestion} multiline />
          <Pressable style={[s.btn, posting && { opacity: 0.6 }]} onPress={submit} disabled={posting}>
            <Text style={s.btnText}>Kirim Pertanyaan</Text>
          </Pressable>
        </View>
        {data.map((q) => (
          <View key={q.id} style={s.card}>
            <View style={s.qHeader}>
              <Feather name="help-circle" size={14} color={COLORS.accent} />
              <Text style={s.to}>Kepada {q.targetMember}</Text>
            </View>
            <Text style={s.question}>{q.question}</Text>
            {q.answer ? (
              <View style={s.answerBox}>
                <Text style={s.ansLabel}>Jawaban:</Text>
                <Text style={s.answer}>{q.answer}</Text>
              </View>
            ) : (
              <Text style={s.unanswered}>Belum dijawab</Text>
            )}
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
  postCard: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, marginBottom: 16, gap: 10 },
  input: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, color: COLORS.text, fontFamily: "Inter_400Regular", fontSize: 14 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#0a0a18" },
  card: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  qHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  to: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: COLORS.accent },
  question: { fontFamily: "Inter_500Medium", fontSize: 14, color: COLORS.text, marginBottom: 8 },
  answerBox: { backgroundColor: COLORS.primaryDim, borderRadius: 10, padding: 10 },
  ansLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.primary, marginBottom: 4 },
  answer: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.text },
  unanswered: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textDim, fontStyle: "italic" },
});
