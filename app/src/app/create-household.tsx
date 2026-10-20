import Feather from "@expo/vector-icons/Feather";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { authClient } from "@/lib/auth-client";
import {
  createHouseholdMutationOptions,
  householdsQueryOptions,
} from "@/options/households";
import { useTheme } from "@/theme";
import { avatarSchema, type Avatar } from "@shared/schemas/member-schema";

type Mode = "create" | "join";

// Same minimum as the shared schemas
const MIN_LENGTH = 2;

// TODO: share with TaskCard and household
const avatarEmoji: Record<Avatar, string> = {
  FOX: "🦊",
  PIG: "🐷",
  FROG: "🐸",
  CHICKEN: "🐥",
  OCTOPUS: "🐙",
  DOLPHIN: "🐬",
  OWL: "🦉",
  UNICORN: "🦄",
};

export default function CreateHousehold() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>("create");
  const queryClient = useQueryClient();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await authClient.signOut();
      // The next user must not see this user's cached data
      queryClient.clear();
    } catch (e) {
      console.warn("Sign out failed", e);
      setSignOutError("Kunde inte logga ut");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <View
          accessibilityRole="tablist"
          style={[styles.segment, { backgroundColor: colors.surface }]}>
          <SegmentButton
            icon="home"
            label="Skapa nytt"
            selected={mode === "create"}
            onPress={() => setMode("create")}
          />
          <SegmentButton
            icon="user-plus"
            label="Gå med med kod"
            selected={mode === "join"}
            onPress={() => setMode("join")}
          />
        </View>

        {mode === "create" ? (
          <CreateForm />
        ) : (
          // TODO: join by code (#27)
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Kommer snart
            </Text>
          </View>
        )}

        {signOutError && (
          <Text style={[styles.error, { color: colors.text }]}>
            {signOutError}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOut,
            { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Feather name="log-out" size={14} color={colors.textMuted} />
          <Text style={[styles.signOutText, { color: colors.textMuted }]}>
            Logga ut
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CreateForm() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<Avatar | null>(null);

  const createMutation = useMutation(createHouseholdMutationOptions);
  const created = createMutation.data;

  const canSubmit =
    name.trim().length >= MIN_LENGTH &&
    nickname.trim().length >= MIN_LENGTH &&
    avatar !== null &&
    !createMutation.isPending;

  const handleCreate = () => {
    if (!canSubmit) return;
    createMutation.mutate({
      name: name.trim(),
      nickname: nickname.trim(),
      avatar,
    });
  };

  // Refetching the list flips the guard in _layout, which opens the tabs
  const handleContinue = () =>
    queryClient.invalidateQueries({
      queryKey: householdsQueryOptions.queryKey,
    });

  return (
    <>
      <View
        style={[
          styles.card,
          styles.welcome,
          { backgroundColor: colors.surface },
        ]}>
        <View
          style={[styles.welcomeIcon, { backgroundColor: colors.background }]}>
          <Text style={styles.welcomeEmoji}>🏡</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Välkommen hem
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Ge ert hushåll ett namn för att komma igång.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Field
          label="Hushållets namn"
          placeholder="t.ex. Storgatan 12 eller Familjen Lindqvist"
          value={name}
          onChangeText={setName}
          editable={!created}
        />
        <Field
          label="Ditt smeknamn"
          placeholder="Så ser de andra dig i hushållet"
          value={nickname}
          onChangeText={setNickname}
          editable={!created}
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            Välj avatar
          </Text>
          <View style={styles.avatars}>
            {avatarSchema.options.map((option) => {
              const selected = avatar === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityLabel={option}
                  accessibilityState={{ selected, disabled: !!created }}
                  disabled={!!created}
                  onPress={() => setAvatar(option)}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: colors.background,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text style={styles.avatarEmoji}>{avatarEmoji[option]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.codeBox,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}>
          <Feather name="key" size={18} color={colors.primary} />
          <View style={styles.codeText}>
            <Text style={[styles.codeLabel, { color: colors.textMuted }]}>
              ER UNIKA DELNINGSKOD
            </Text>
            <Text
              selectable
              style={[
                styles.code,
                { color: created ? colors.text : colors.textMuted },
              ]}>
              {created ? created.accessCode : "Skapas automatiskt"}
            </Text>
          </View>
        </View>

        {createMutation.error && (
          <Text style={[styles.error, { color: colors.text }]}>
            {createMutation.error.message}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !created && !canSubmit }}
          disabled={!created && !canSubmit}
          onPress={created ? handleContinue : handleCreate}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              opacity: !created && !canSubmit ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}>
          {createMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather
                name={created ? "arrow-right" : "plus-circle"}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.primaryButtonText}>
                {created ? "Fortsätt" : "Skapa hushåll"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </>
  );
}

function SegmentButton({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const color = selected ? colors.text : colors.textMuted;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.segmentButton,
        selected && { backgroundColor: colors.background },
      ]}>
      <Feather name={icon} size={16} color={color} />
      <Text style={[styles.segmentText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, ...inputProps }: TextInputProps & { label: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
        {...inputProps}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  segment: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "500",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  welcome: {
    alignItems: "center",
    gap: 6,
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  welcomeEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  avatars: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 22,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  codeText: {
    flex: 1,
    gap: 2,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  code: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  error: {
    fontSize: 14,
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
