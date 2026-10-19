import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

// Placeholder until the signed-in member's avatar is fetched from the backend.
const placeholderAvatar = "🦊";

// Placeholder until the active household is fetched from the backend.
const placeholderHousehold = { name: "Hushållet", accessCode: "HUSH7294" };

export default function ScreenHeader(): React.JSX.Element {
  const { colors, scheme } = useTheme();
  const avatarBackground = scheme === "light" ? "#ECEBFD" : "#33354A";

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.household}>
        <Text
          style={[styles.householdName, { color: colors.text }]}
          numberOfLines={1}>
          {placeholderHousehold.name}
        </Text>
        <Text style={[styles.householdCode, { color: colors.textMuted }]}>
          {placeholderHousehold.accessCode}
        </Text>
      </View>
      <Link href='/profile' asChild>
        <Pressable
          accessibilityRole='button'
          accessibilityLabel='Profil'
          style={StyleSheet.flatten([
            styles.avatar,
            { backgroundColor: avatarBackground },
          ])}>
          <Text style={styles.avatarEmoji}>{placeholderAvatar}</Text>
          <View style={[styles.badge, { borderColor: colors.background }]}>
            <SymbolView
              name={{ ios: "person.fill", android: "person", web: "person" }}
              size={10}
              tintColor='#FFFFFF'
              fallback={<Text style={styles.badgeFallback}>👤</Text>}
            />
          </View>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  household: {
    flex: 1,
  },
  householdName: {
    fontSize: 20,
    fontWeight: "700",
  },
  householdCode: {
    fontSize: 13,
    fontWeight: "600",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 22,
  },
  badge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    backgroundColor: "#D32F2F",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeFallback: {
    fontSize: 8,
  },
});
