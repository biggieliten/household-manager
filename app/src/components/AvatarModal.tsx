import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/theme";
import type { Avatar } from "@shared/schemas/member-schema";
import AvatarPicker from "@/components/AvatarPicker";

type Props = {
  value: Avatar | null;
  taken: Avatar[];
  isPending: boolean;
  error?: string;
  onChange: (avatar: Avatar) => void;
  onClose: () => void;
};

export default function AvatarModal({
  value,
  taken,
  isPending,
  error,
  onChange,
  onClose,
}: Props) {
  const { colors } = useTheme();

  const handleCancel = () => {
    if (!isPending) onClose();
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View
            accessibilityViewIsModal
            onAccessibilityEscape={handleCancel}
            style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Byt avatar
            </Text>
            <Text style={{ color: colors.textMuted }}>
              Avataren visas i det här hushållet.
            </Text>
            <AvatarPicker
              value={value}
              taken={taken}
              disabled={isPending}
              onChange={onChange}
            />
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
                <Text style={{ color: colors.text }}>Stäng</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
