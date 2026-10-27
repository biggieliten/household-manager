import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/theme";

type Props = {
  groupName: string;
  isPending: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteTaskGroupModal({
  groupName,
  isPending,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const handleCancel = () => {
    if (!isPending) onCancel();
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <ScrollView
        style={{ ...styles.overlay, backgroundColor: colors.overlay }}
        contentContainerStyle={styles.content}>
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={handleCancel}
          style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Ta bort sysslegrupp
          </Text>
          <Text style={{ color: colors.textMuted }}>
            Vill du ta bort gruppen {groupName}? Sysslorna finns kvar.
          </Text>
          {error && (
            <Text accessibilityRole="alert" style={{ color: colors.text }}>
              {error}
            </Text>
          )}
          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              onPress={handleCancel}
              style={[styles.button, { backgroundColor: colors.background }]}>
              <Text style={{ color: colors.text }}>Avbryt</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ta bort sysslegrupp"
              accessibilityState={{ disabled: isPending, busy: isPending }}
              disabled={isPending}
              onPress={onConfirm}
              style={[styles.button, { backgroundColor: colors.primary }]}>
              {isPending ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={{ ...styles.confirmText, color: colors.onPrimary }}>Ta bort</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  title: { fontSize: 20, fontWeight: "700" },
  buttons: { flexDirection: "row", gap: 12 },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: { fontWeight: "600" },
});
