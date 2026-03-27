import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { useApi } from "@/hooks/useApi";

interface PollOption { text: string; votes: string[]; }
interface Poll { id: number; question: string; options: PollOption[]; createdBy: string; createdAt: string; }

export default function VotingScreen() {
  const insets = useSafeAreaInsets();
  const { user, guestName } = useAuth();
  const { get, post } = useApi();
  const qc = useQueryClient();
  const { data = [], isLoading, refetch } = useQuery<Poll[]>({ queryKey: ["polls"], queryFn: () => get("/api/polls") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const voter = user?.username || guestName || "";

  async function vote(pollId: number, optIdx: number) {
    if (!voter) { Alert.alert("Login atau masuk sebagai tamu untuk vote"); return; }
    try {
      await post(`/api/polls/${pollId}/vote`, { optionIndex: optIdx, voter });
      qc.invalidateQueries({ queryKey: ["polls"] });
    } catch (e: unknown) { Alert.alert("Gagal vote", e instanceof Error ? e.message : "Error"); }
  }

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Voting</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        {!data.length && !isLoading && (
          <View style={s.empty}><Feather name="bar-chart-2" size={36} color={COLORS.textDim} /><Text style={s.emptyText}>Belum ada polling</Text></View>
        )}
        {data.map((poll) => {
          const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes?.length ?? 0), 0);
          const myVote = poll.options.findIndex((o) => o.votes?.includes(voter));
          return (
            <View key={poll.id} style={s.card}>
              <Text style={s.question}>{poll.question}</Text>
              <Text style={s.totalVotes}>{totalVotes} suara</Text>
              {poll.options.map((opt, i) => {
                const pct = totalVotes > 0 ? Math.round((opt.votes?.length ?? 0) / totalVotes * 100) : 0;
                const voted = myVote === i;
                return (
                  <Pressable key={i} style={[s.optionBtn, voted && s.optionBtnVoted]} onPress={() => vote(poll.id, i)}>
                    <View style={[s.optionBar, { width: `${pct}%` as `${number}%`, backgroundColor: voted ? COLORS.primary + "33" : COLORS.bgCardHover }]} />
                    <Text style={[s.optionText, voted && { color: COLORS.primary }]}>{opt.text}</Text>
                    <Text style={s.pct}>{pct}%</Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: COLORS.text, flex: 1, textAlign: "center" },
  card: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, marginBottom: 14 },
  question: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text, marginBottom: 4 },
  totalVotes: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted, marginBottom: 12 },
  optionBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, overflow: "hidden", marginBottom: 8, minHeight: 42 },
  optionBtnVoted: { borderColor: COLORS.primary },
  optionBar: { position: "absolute", left: 0, top: 0, bottom: 0 },
  optionText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.text, paddingHorizontal: 12, paddingVertical: 10 },
  pct: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.textMuted, paddingRight: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim },
});
