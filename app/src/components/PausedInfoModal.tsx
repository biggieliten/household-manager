import Feather from "@expo/vector-icons/Feather";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

type Props = {
  onClose: () => void;
};

export default function PausedInfoModal({ onClose }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.titleRow}>
            <Feather name="pause-circle" size={24} color={colors.warningText} />
            <Text style={[styles.title, { color: colors.text }]}>
              Du är pausad
            </Text>
          </View>
          <Text style={{ color: colors.textMuted }}>
            Medan du är pausad kan du inte utföra sysslor. Dina poäng i
            statistiken räknas om, så att pausen inte drar ner dig.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "700" },
  button: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "600" },
});
