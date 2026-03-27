import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface Song { id: number; title: string; artist: string; youtubeUrl: string | null; fileUrl: string | null; addedBy: string; createdAt: string; }

export default function MusicScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const { data = [], isLoading, refetch } = useQuery<Song[]>({ queryKey: ["music"], queryFn: () => get("/api/music") });
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [playing, setPlaying] = useState<number | null>(null);

  function openYT(url: string) {
    Linking.openURL(url).catch(() => {});
  }

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <Text style={s.title}>Musik</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
      >
        <View style={s.banner}>
          <Ionicons name="musical-notes" size={32} color={COLORS.primary} />
          <View>
            <Text style={s.bannerTitle}>Playlist Komunitas</Text>
            <Text style={s.bannerSub}>{data.length} lagu</Text>
          </View>
        </View>
        {!data.length && !isLoading && (
          <View style={s.empty}><Feather name="music" size={36} color={COLORS.textDim} /><Text style={s.emptyText}>Belum ada lagu</Text></View>
        )}
        {data.map((song, i) => (
          <Pressable
            key={song.id}
            style={({ pressed }) => [s.songCard, pressed && { opacity: 0.8 }, playing === song.id && s.songCardPlaying]}
            onPress={() => {
              if (song.youtubeUrl) openYT(song.youtubeUrl);
              else setPlaying(playing === song.id ? null : song.id);
            }}
          >
            <View style={[s.trackNum, playing === song.id && s.trackNumPlaying]}>
              {playing === song.id
                ? <Ionicons name="pause" size={16} color={COLORS.primary} />
                : <Text style={s.trackNumText}>{i + 1}</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.songTitle}>{song.title}</Text>
              <Text style={s.songArtist}>{song.artist}</Text>
            </View>
            {song.youtubeUrl && <Ionicons name="logo-youtube" size={18} color="#ff0000" />}
            <Text style={s.addedBy}>{song.addedBy}</Text>
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
  banner: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 20, marginBottom: 20 },
  bannerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: COLORS.text },
  bannerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted },
  songCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 12, marginBottom: 8 },
  songCardPlaying: { borderColor: COLORS.primary },
  trackNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bgCard, alignItems: "center", justifyContent: "center" },
  trackNumPlaying: { backgroundColor: COLORS.primaryDim },
  trackNumText: { fontFamily: "Inter_500Medium", fontSize: 14, color: COLORS.textMuted },
  songTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.text },
  songArtist: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted },
  addedBy: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textDim },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim },
});
