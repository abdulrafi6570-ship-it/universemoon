import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/auth";
import { useApi } from "@/hooks/useApi";

interface ChatMsg {
  id: number;
  sender: string;
  content: string;
  isSticker: boolean;
  stickerCode: string | null;
  reactions: Record<string, string[]>;
  createdAt: string;
  replyToId: number | null;
  replyToContent: string | null;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg, isMe }: { msg: ChatMsg; isMe: boolean }) {
  const reactionList = Object.entries(msg.reactions || {});
  return (
    <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapMe]}>
      {!isMe && <Text style={styles.senderName}>{msg.sender}</Text>}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {msg.replyToContent && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyText} numberOfLines={1}>{msg.replyToContent}</Text>
          </View>
        )}
        {msg.isSticker ? (
          <Text style={{ fontSize: 40 }}>{msg.content}</Text>
        ) : (
          <Text style={[styles.msgText, isMe && { color: "#0a0a18" }]}>{msg.content}</Text>
        )}
        <Text style={[styles.timeText, isMe && { color: "rgba(10,10,24,0.6)" }]}>{formatTime(msg.createdAt)}</Text>
      </View>
      {reactionList.length > 0 && (
        <View style={styles.reactRow}>
          {reactionList.map(([emoji, users]) => (
            <View key={emoji} style={styles.reactBadge}>
              <Text style={{ fontSize: 12 }}>{emoji}</Text>
              <Text style={styles.reactCount}>{users.length}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { user, guestName } = useAuth();
  const { get, post } = useApi();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const sender = user?.username || guestName || "Tamu";
  const canSend = !!(user || guestName);

  const { data: messages = [], refetch } = useQuery<ChatMsg[]>({
    queryKey: ["chat"],
    queryFn: () => get("/api/chat?limit=50"),
    refetchInterval: 5000,
  });

  async function sendMessage() {
    if (!text.trim() || sending || !canSend) return;
    const content = text.trim();
    setText("");
    setSending(true);
    try {
      await post("/api/chat", { sender, content });
      queryClient.invalidateQueries({ queryKey: ["chat"] });
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  }

  const reversed = [...messages].reverse();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Ionicons name="moon" size={18} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Group Chat</Text>
        <Pressable onPress={() => refetch()}>
          <Feather name="refresh-cw" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={reversed}
          keyExtractor={(item) => item.id.toString()}
          inverted
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MessageBubble msg={item} isMe={item.sender === sender} />
          )}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!!messages.length}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-circle" size={40} color={COLORS.textDim} />
              <Text style={styles.emptyText}>Belum ada pesan. Mulai ngobrol!</Text>
            </View>
          }
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(bottomPad, 8) }]}>
          <TextInput
            style={styles.input}
            placeholder={canSend ? "Ketik pesan..." : "Login untuk chat"}
            placeholderTextColor={COLORS.textDim}
            value={text}
            onChangeText={setText}
            editable={canSend}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || !canSend) && { opacity: 0.4 }]}
            onPress={sendMessage}
            disabled={!text.trim() || !canSend || sending}
          >
            <Ionicons name="send" size={18} color="#0a0a18" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  bubbleWrap: { marginBottom: 10, maxWidth: "80%", alignSelf: "flex-start" },
  bubbleWrapMe: { alignSelf: "flex-end" },
  senderName: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.primary, marginBottom: 3, marginLeft: 4 },
  bubble: {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleThem: { backgroundColor: COLORS.bgCard, borderColor: COLORS.border },
  bubbleMe: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  replyPreview: {
    borderLeftWidth: 2, borderLeftColor: COLORS.accent,
    paddingLeft: 8, marginBottom: 6,
  },
  replyText: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textMuted },
  msgText: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.text, lineHeight: 20 },
  timeText: { fontFamily: "Inter_400Regular", fontSize: 10, color: COLORS.textDim, marginTop: 4, textAlign: "right" },
  reactRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  reactBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3,
  },
  reactCount: { fontFamily: "Inter_500Medium", fontSize: 10, color: COLORS.textMuted },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  input: {
    flex: 1, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim, textAlign: "center", lineHeight: 20 },
});
