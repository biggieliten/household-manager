import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

// Placeholder until the signed-in member's avatar is fetched from the backend.
const placeholderAvatar = "🦊";

// Placeholder until the active household is fetched from the backend.
const placeholderHousehold = { name: "Hushållet" };

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
});
