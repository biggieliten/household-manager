import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { signOutMutationOptions } from "@/options/auth";
import { ThemePicker, useTheme } from "@/theme";

export default function Profile() {
  const { colors } = useTheme();
  const signOutMutation = useMutation(signOutMutationOptions);

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
        accessibilityState={{ disabled: signOutMutation.isPending }}
        disabled={signOutMutation.isPending}
        onPress={() => signOutMutation.mutate()}
        style={[
          styles.signOut,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <Text style={[styles.signOutText, { color: "#D32F2F" }]}>Logga ut</Text>
      </Pressable>

      {signOutMutation.error && (
        <Text style={[styles.error, { color: colors.text }]}>
          {signOutMutation.error.message}
        </Text>
      )}
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
  error: {
    fontSize: 14,
    textAlign: "center",
  },
});
