import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/auth";
import COLORS from "@/constants/colors";

export default function Index() {
  const { user, guestName, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (user || guestName) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth" />;
}
