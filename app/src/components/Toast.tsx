import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

type Props = {
  message: string;
  onClose: () => void;
};

// Stays until the user closes it, so the parent decides what happens next
export default function Toast({ message, onClose }: Props) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        { ...styles.toast, shadowColor: colors.shadow },
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}>
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Stäng"
        onPress={onClose}
        hitSlop={8}>
        <Text style={[styles.close, { color: colors.textMuted }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    elevation: 6,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  close: {
    fontSize: 16,
    fontWeight: "700",
  },
});
