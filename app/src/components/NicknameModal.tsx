import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/theme";
import { updateMyNicknameSchema } from "@shared/schemas/member-schema";

type Props = {
  nickname: string;
  isPending: boolean;
  error?: string;
  onSave: (nickname: string) => void;
  onCancel: () => void;
};

export default function NicknameModal({
  nickname,
  isPending,
  error,
  onSave,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState(nickname);
  const input = { nickname: draft.trim() };
  const canSave = updateMyNicknameSchema.safeParse(input).success && !isPending;

  const handleSave = () => {
    if (canSave) onSave(input.nickname);
  };

  const handleCancel = () => {
    if (!isPending) onCancel();
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={{ ...styles.overlay, backgroundColor: colors.overlay }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View
            accessibilityViewIsModal
            onAccessibilityEscape={handleCancel}
            style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Ändra visningsnamn
            </Text>
            <Text style={{ color: colors.textMuted }}>
              Namnet visas i det här hushållet. Ange minst två tecken.
            </Text>
            <TextInput
              accessibilityLabel="Visningsnamn"
              value={draft}
              onChangeText={setDraft}
              editable={!isPending}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
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
                <Text style={{ color: colors.text }}>Avbryt</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Spara visningsnamn"
                accessibilityState={{ disabled: !canSave, busy: isPending }}
                disabled={!canSave}
                onPress={handleSave}
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    opacity: canSave || isPending ? 1 : 0.5,
                  },
                ]}>
                {isPending ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={{ ...styles.saveText, color: colors.onPrimary }}>Spara</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
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
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
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
  saveText: {
    fontWeight: "600",
  },
});
