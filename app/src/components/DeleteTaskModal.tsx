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
  step: "choose" | "confirm";
  isPending: boolean;
  error?: string;
  dangerColor: string;
  onArchive: () => void;
  onChooseDelete: () => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
};

export default function DeleteTaskModal({
  step,
  isPending,
  error,
  dangerColor,
  onArchive,
  onChooseDelete,
  onConfirmDelete,
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
      <ScrollView style={{ ...styles.overlay, backgroundColor: colors.overlay }} contentContainerStyle={styles.content}>
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={handleCancel}
          style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Ta bort syssla
          </Text>

          {step === "choose" ? (
            <>
              <Pressable
                accessibilityRole="button"
                disabled={isPending}
                onPress={onArchive}
                style={[styles.option, { backgroundColor: colors.background }]}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  Arkivera syssla
                </Text>
                <Text style={{ color: colors.textMuted }}>
                  Sysslan arkiveras och statistiken sparas.
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isPending}
                onPress={onChooseDelete}
                style={[styles.option, { backgroundColor: dangerColor }]}>
                <Text style={[styles.optionTitle, { color: colors.onPrimary }]}>
                  Ta bort permanent
                </Text>
                <Text style={{ color: colors.onDangerMuted }}>
                  Sysslan och tillhörande statistik raderas.
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isPending}
                onPress={handleCancel}
                style={styles.cancel}>
                <Text style={{ color: colors.text }}>Avbryt</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={{ color: colors.textMuted }}>
                Är du säker på att du vill ta bort sysslan permanent? All
                tillhörande statistik kommer också att raderas.
              </Text>
              <View style={styles.buttons}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isPending}
                  onPress={handleCancel}
                  style={[
                    styles.button,
                    { backgroundColor: colors.background },
                  ]}>
                  <Text style={{ color: colors.text }}>Avbryt</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isPending, busy: isPending }}
                  disabled={isPending}
                  onPress={onConfirmDelete}
                  style={[styles.button, { backgroundColor: dangerColor }]}>
                  {isPending ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={{ ...styles.confirmText, color: colors.onPrimary }}>Ja, ta bort</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}

          {error && (
            <Text accessibilityRole="alert" style={{ color: colors.text }}>
              {error}
            </Text>
          )}
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
  option: { borderRadius: 12, padding: 14, gap: 4 },
  optionTitle: { fontSize: 16, fontWeight: "600" },
  cancel: { alignItems: "center", paddingVertical: 8 },
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
