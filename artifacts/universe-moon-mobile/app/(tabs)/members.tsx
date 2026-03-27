import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useApi } from "@/hooks/useApi";

interface Member {
  id: number;
  name: string;
  nickname: string;
  role: string;
  bio: string | null;
  joinDate: string | null;
  specialty: string | null;
  avatarUrl: string | null;
  isActive: boolean;
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.slice(0, 2).toUpperCase();
  const colors = [COLORS.primary, COLORS.accent, COLORS.green, COLORS.yellow];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      alignItems: "center", justifyContent: "center",
      borderWidth: 1, borderColor: COLORS.border,
    }, { backgroundColor: color + "22" }]}>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: size * 0.36, color }}>{initials}</Text>
    </View>
  );
}

function MemberCard({ member }: { member: Member }) {
  const isAdmin = member.role?.toLowerCase().includes("admin");
  return (
    <View style={styles.card}>
      <Avatar name={member.nickname || member.name} />
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{member.nickname || member.name}</Text>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={10} color={COLORS.primary} />
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>@{member.name}</Text>
        {member.bio && <Text style={styles.bio} numberOfLines={1}>{member.bio}</Text>}
        {member.joinDate && (
          <Text style={styles.joinDate}>Bergabung {member.joinDate}</Text>
        )}
      </View>
    </View>
  );
}

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const { get } = useApi();
  const [search, setSearch] = useState("");

  const { data: members = [], isLoading, refetch } = useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: () => get("/api/members"),
  });

  const filtered = members.filter(
    (m) =>
      m.isActive &&
      ((m.nickname || m.name).toLowerCase().includes(search.toLowerCase()) ||
        m.name.toLowerCase().includes(search.toLowerCase()))
  );

  const admins = filtered.filter((m) => m.role?.toLowerCase().includes("admin"));
  const regulars = filtered.filter((m) => !m.role?.toLowerCase().includes("admin"));

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Ionicons name="people" size={18} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Anggota</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Feather name="search" size={16} color={COLORS.textDim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari anggota..."
          placeholderTextColor={COLORS.textDim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
      >
        {admins.length > 0 && (
          <>
            <Text style={styles.groupLabel}>Admin</Text>
            {admins.map((m) => <MemberCard key={m.id} member={m} />)}
          </>
        )}
        {regulars.length > 0 && (
          <>
            <Text style={styles.groupLabel}>Anggota</Text>
            {regulars.map((m) => <MemberCard key={m.id} member={m} />)}
          </>
        )}
        {!filtered.length && !isLoading && (
          <View style={styles.empty}>
            <Feather name="users" size={40} color={COLORS.textDim} />
            <Text style={styles.emptyText}>Tidak ada anggota ditemukan</Text>
          </View>
        )}
      </ScrollView>
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
  countBadge: {
    backgroundColor: COLORS.primaryDim, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  countText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: COLORS.primary },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    margin: 16, padding: 12,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.text },
  groupLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: COLORS.textMuted, marginBottom: 10, letterSpacing: 0.5 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 16, padding: 14, marginBottom: 10,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  nickname: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.text },
  adminBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: COLORS.primaryDim, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  adminText: { fontFamily: "Inter_500Medium", fontSize: 10, color: COLORS.primary },
  username: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted },
  bio: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textDim, marginTop: 2 },
  joinDate: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim },
});
