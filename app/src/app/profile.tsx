import { Pressable, StyleSheet, Text, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import { ThemePicker, useTheme } from "@/theme";

export default function Profile() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Utseende
        </Text>
        <ThemePicker />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => authClient.signOut()}
        style={[
          styles.signOut,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.signOutText, { color: "#D32F2F" }]}>Logga ut</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 32,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  signOut: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  signOutText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
