import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

type Props = {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmBox({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        { ...styles.box, shadowColor: colors.shadow },
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}>
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      <View style={styles.buttons}>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={[styles.button, { backgroundColor: colors.surface }]}>
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Avbryt
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onConfirm}
          style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {confirmLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    elevation: 4,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  message: {
    fontSize: 15,
    fontWeight: "600",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  button: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
