import { Pressable, StyleSheet, Text, View } from "react-native";

import { getErrorMessage } from "@/lib/errors";
import { useTheme } from "@/theme";

interface Props {
  error: Error;
  retry: () => void;
}

// Fills the available space with a centered error message
export default function ErrorView({ error, retry }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.centered}>
      <Text style={[styles.title, { color: colors.text }]}>Något gick fel</Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>
        {getErrorMessage(error)}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={retry}
        style={[styles.retryButton, { backgroundColor: colors.primary }]}>
        <Text style={styles.retryButtonText}>Försök igen</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: { color: "#FFFFFF", fontWeight: "600" },
});
