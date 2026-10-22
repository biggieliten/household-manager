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
import { updateHouseholdSchema } from "@shared/schemas/household-schema";

type Props = {
  name: string;
  isPending: boolean;
  error?: string;
  onSave: (name: string) => void;
  onCancel: () => void;
};

export default function HouseholdNameModal({
  name,
  isPending,
  error,
  onSave,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState(name);
  const input = { name: draft.trim() };
  const canSave = updateHouseholdSchema.safeParse(input).success && !isPending;

  const handleSave = () => {
    if (canSave) onSave(input.name);
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
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View
            accessibilityViewIsModal
            onAccessibilityEscape={handleCancel}
            style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Ändra hushållets namn
            </Text>
            <Text style={{ color: colors.textMuted }}>
              Namnet visas för alla medlemmar. Ange minst två tecken.
            </Text>
            <TextInput
              accessibilityLabel="Hushållets namn"
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
                accessibilityLabel="Spara hushållets namn"
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
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveText}>Spara</Text>
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
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
