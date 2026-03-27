import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/auth";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  sub: string;
  href?: string;
  onPress?: () => void;
  color?: string;
}

interface Section {
  title: string;
  items: MenuItem[];
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, guestName, logout } = useAuth();
  const displayName = user?.username || guestName;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleLogout() {
    Alert.alert("Keluar", "Yakin mau logout?", [
      { text: "Batal", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/auth"); } },
    ]);
  }

  const sections: Section[] = [
    {
      title: "Konten",
      items: [
        {
          icon: <Ionicons name="book-outline" size={20} color={COLORS.accent} />,
          label: "Memories", sub: "Kenangan bersama", href: "/memories",
        },
        {
          icon: <Ionicons name="musical-notes-outline" size={20} color={COLORS.primary} />,
          label: "Musik", sub: "Playlist komunitas", href: "/music",
        },
        {
          icon: <Ionicons name="star-outline" size={20} color={COLORS.yellow} />,
          label: "Hall of Fame", sub: "Top anggota", href: "/hall-of-fame",
        },
        {
          icon: <Ionicons name="trophy-outline" size={20} color={COLORS.green} />,
          label: "Leaderboard", sub: "Ranking XP & Game", href: "/leaderboard",
        },
      ],
    },
    {
      title: "Komunitas",
      items: [
        {
          icon: <Feather name="sun" size={20} color={COLORS.yellow} />,
          label: "Story", sub: "Cerita 24 jam", href: "/story",
        },
        {
          icon: <Feather name="zap" size={20} color={COLORS.primary} />,
          label: "Shoutout", sub: "Apresiasi anggota", href: "/shoutout",
        },
        {
          icon: <Ionicons name="happy-outline" size={20} color={COLORS.accent} />,
          label: "Moodboard", sub: "Mood hari ini", href: "/moodboard",
        },
        {
          icon: <Feather name="help-circle" size={20} color={COLORS.primary} />,
          label: "Q&A", sub: "Tanya jawab anonim", href: "/qa",
        },
        {
          icon: <Feather name="book-open" size={20} color={COLORS.yellow} />,
          label: "Fanfic", sub: "Cerita & karya", href: "/fanfic",
        },
        {
          icon: <Feather name="message-square" size={20} color={COLORS.red} />,
          label: "NGL", sub: "Pesan anonim", href: "/ngl",
        },
      ],
    },
    {
      title: "Seru",
      items: [
        {
          icon: <Feather name="image" size={20} color={COLORS.green} />,
          label: "Meme", sub: "Meme board", href: "/meme",
        },
        {
          icon: <MaterialCommunityIcons name="cards" size={20} color={COLORS.primary} />,
          label: "Stiker", sub: "Custom stickers", href: "/stickers",
        },
        {
          icon: <Feather name="award" size={20} color={COLORS.yellow} />,
          label: "Voting", sub: "Poll komunitas", href: "/voting",
        },
        {
          icon: <Ionicons name="game-controller-outline" size={20} color={COLORS.accent} />,
          label: "Games", sub: "Mini games", href: "/games",
        },
      ],
    },
    {
      title: "Info",
      items: [
        {
          icon: <Feather name="bar-chart-2" size={20} color={COLORS.primary} />,
          label: "Statistik", sub: "Data komunitas", href: "/stats",
        },
        {
          icon: <Feather name="gift" size={20} color={COLORS.accent} />,
          label: "Ulang Tahun", sub: "Birthday tracker", href: "/birthday",
        },
        {
          icon: <Feather name="flag" size={20} color={COLORS.green} />,
          label: "Milestones", sub: "Pencapaian grup", href: "/milestones",
        },
        {
          icon: <Feather name="book" size={20} color={COLORS.yellow} />,
          label: "Peraturan", sub: "Rules & FAQ", href: "/rules",
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Ionicons name="grid" size={18} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Lainnya</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name={user ? "person" : "person-outline"} size={24} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{displayName || "Belum Login"}</Text>
          {user && <Text style={styles.profileRole}>{user.role} · XP {user.xp}</Text>}
          {guestName && <Text style={styles.profileRole}>Mode Tamu</Text>}
        </View>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={16} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingHorizontal: 16 }}
      >
        {sections.map((s) => (
          <View key={s.title} style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <View style={styles.sectionCard}>
              {s.items.map((item, i) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.menuItem,
                    i < s.items.length - 1 && styles.menuItemBorder,
                    pressed && { backgroundColor: COLORS.bgCardHover },
                  ]}
                  onPress={() => {
                    if (item.onPress) item.onPress();
                    else if (item.href) router.push(item.href as never);
                  }}
                >
                  <View style={styles.menuIcon}>{item.icon}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSub}>{item.sub}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={COLORS.textDim} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
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
  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 16, marginVertical: 16,
    backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 16, padding: 14,
  },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 16, color: COLORS.text },
  profileRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  logoutBtn: { padding: 8 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold", fontSize: 12, color: COLORS.textMuted,
    marginBottom: 8, letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, overflow: "hidden",
  },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bgCard, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: COLORS.text },
  menuSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
});
