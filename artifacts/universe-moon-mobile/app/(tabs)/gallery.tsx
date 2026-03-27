import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { useApi } from "@/hooks/useApi";

interface Photo {
  id: number;
  url: string;
  caption: string;
  uploadedBy: string;
  createdAt: string;
}

const { width } = Dimensions.get("window");
const COL = 3;
const IMG_SIZE = (width - 32 - (COL - 1) * 2) / COL;

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { get, authHeaders, baseUrl } = useApi();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: photos = [], isLoading, refetch } = useQuery<Photo[]>({
    queryKey: ["photos"],
    queryFn: () => get("/api/photos"),
  });

  async function pickAndUpload() {
    if (!user) { Alert.alert("Login dulu untuk upload foto"); return; }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Izin diperlukan untuk akses galeri"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", { uri: asset.uri, name: "photo.jpg", type: "image/jpeg" } as never);
      const uploadRes = await fetch(`${baseUrl}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authHeaders()["Authorization"] || ""}` },
        body: form,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload gagal");
      await fetch(`${baseUrl}/api/photos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ url: uploadData.url, caption: "", uploadedBy: user.username }),
      });
      queryClient.invalidateQueries({ queryKey: ["photos"] });
      Alert.alert("Foto berhasil diupload!");
    } catch (e: unknown) {
      Alert.alert("Gagal", e instanceof Error ? e.message : "Upload error");
    } finally {
      setUploading(false);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Ionicons name="images" size={18} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Galeri</Text>
        {user && (
          <Pressable style={styles.uploadBtn} onPress={pickAndUpload} disabled={uploading}>
            {uploading ? (
              <Feather name="loader" size={18} color={COLORS.primary} />
            ) : (
              <Feather name="plus" size={18} color={COLORS.primary} />
            )}
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
      >
        {!photos.length && !isLoading ? (
          <View style={styles.empty}>
            <Feather name="image" size={40} color={COLORS.textDim} />
            <Text style={styles.emptyText}>Belum ada foto. Upload foto pertama!</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {photos.map((p) => (
              <Pressable key={p.id} onPress={() => setSelected(p)}>
                <Image
                  source={{ uri: p.url.startsWith("http") ? p.url : `${baseUrl}${p.url}` }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {selected && (
        <Modal transparent animationType="fade" onRequestClose={() => setSelected(null)}>
          <Pressable style={styles.overlay} onPress={() => setSelected(null)}>
            <View style={styles.lightbox}>
              <Image
                source={{ uri: selected.url.startsWith("http") ? selected.url : `${baseUrl}${selected.url}` }}
                style={styles.lightboxImg}
                resizeMode="contain"
              />
              {!!selected.caption && (
                <Text style={styles.caption}>{selected.caption}</Text>
              )}
              <Text style={styles.captionBy}>oleh {selected.uploadedBy}</Text>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: COLORS.text, flex: 1 },
  uploadBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryDim, alignItems: "center", justifyContent: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  thumb: { width: IMG_SIZE, height: IMG_SIZE, borderRadius: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim, textAlign: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  lightbox: { width: "90%", alignItems: "center" },
  lightboxImg: { width: "100%", height: 400, borderRadius: 12 },
  caption: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.text, marginTop: 12, textAlign: "center" },
  captionBy: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
});
