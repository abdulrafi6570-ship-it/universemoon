import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/auth";

type Mode = "login" | "register" | "guest";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register, loginAsGuest } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function switchMode(m: Mode) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setMode(m);
      setUsername(""); setPassword(""); setToken(""); setGuestName("");
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      if (mode === "login") {
        if (!username.trim() || !password.trim()) {
          Alert.alert("Oops", "Isi username dan password dulu"); return;
        }
        await login(username.trim(), password);
        router.replace("/(tabs)");
      } else if (mode === "register") {
        if (!token.trim() || !username.trim() || !password.trim()) {
          Alert.alert("Oops", "Semua field wajib diisi"); return;
        }
        await register(token.trim(), username.trim(), password);
        Alert.alert("Berhasil!", "Akun dibuat. Silakan login.", [
          { text: "OK", onPress: () => switchMode("login") },
        ]);
      } else {
        if (!guestName.trim()) {
          Alert.alert("Oops", "Masukkan nama kamu"); return;
        }
        await loginAsGuest(guestName.trim());
        router.replace("/(tabs)");
      }
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="moon" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Universe Moon</Text>
            <Text style={styles.subtitle}>Tempat kenangan yang tak pernah pudar</Text>
          </View>

          <View style={styles.tabRow}>
            {(["login", "register", "guest"] as Mode[]).map((m) => (
              <Pressable
                key={m}
                style={[styles.tab, mode === m && styles.tabActive]}
                onPress={() => switchMode(m)}
              >
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === "login" ? "Masuk" : m === "register" ? "Daftar" : "Tamu"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
            {mode === "register" && (
              <View style={styles.field}>
                <Ionicons name="key-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Token (dari admin WA)"
                  placeholderTextColor={COLORS.textDim}
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {mode !== "guest" ? (
              <>
                <View style={styles.field}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor={COLORS.textDim}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.field}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textDim}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.textMuted} />
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.field}>
                <Ionicons name="person-circle-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nama kamu"
                  placeholderTextColor={COLORS.textDim}
                  value={guestName}
                  onChangeText={setGuestName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {mode === "guest" && (
              <Text style={styles.guestNote}>
                Mode tamu bisa lihat konten dan reaksi, tapi tidak bisa post
              </Text>
            )}

            <Pressable
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Ionicons name="sync" size={20} color="#000" />
              ) : (
                <Text style={styles.btnText}>
                  {mode === "login" ? "Masuk ke Semesta" : mode === "register" ? "Buat Akun" : "Masuk Sebagai Tamu"}
                </Text>
              )}
            </Pressable>
          </Animated.View>

          <Text style={styles.footer}>Universe Moon · Didirikan 30/11/2025</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 40 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_700Bold", fontSize: 28, color: COLORS.text, letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textMuted, marginTop: 6, textAlign: "center",
  },
  tabRow: { flexDirection: "row", backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 9 },
  tabActive: { backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.border },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  form: { gap: 12 },
  field: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, height: 52,
  },
  fieldIcon: { marginRight: 10 },
  input: {
    flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: COLORS.text,
  },
  eyeBtn: { padding: 6 },
  guestNote: {
    fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted,
    textAlign: "center", lineHeight: 18,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 14, height: 52,
    alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#0a0a18" },
  footer: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textDim, textAlign: "center", marginTop: 40 },
});
