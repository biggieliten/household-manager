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

import AvatarPicker from "@/components/AvatarPicker";
import { fetchHouseholdPreview } from "@/lib/api/households";
import { authClient } from "@/lib/auth-client";
import {
  createHouseholdMutationOptions,
  householdsQueryOptions,
  joinHouseholdMutationOptions,
} from "@/options/households";
import { useTheme } from "@/theme";
import type { Avatar } from "@shared/schemas/member-schema";

type Mode = "create" | "join";

// Same limits as the shared schemas
const MIN_LENGTH = 2;
const ACCESS_CODE_LENGTH = 8;

export default function CreateHousehold() {
  const { colors } = useTheme();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
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

  if (isSessionPending) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  const initialNickname = session?.user.name ?? "";

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
          <CreateForm initialNickname={initialNickname} />
        ) : (
          <JoinForm initialNickname={initialNickname} />
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

function CreateForm({ initialNickname }: { initialNickname: string }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState(initialNickname);
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

        <AvatarPicker
          value={avatar}
          onChange={setAvatar}
          disabled={!!created}
        />

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

        <PrimaryButton
          icon={created ? "arrow-right" : "plus-circle"}
          label={created ? "Fortsätt" : "Skapa hushåll"}
          disabled={!created && !canSubmit}
          loading={createMutation.isPending}
          onPress={created ? handleContinue : handleCreate}
        />
      </View>
    </>
  );
}

// First the code is checked, then the user picks a nickname and a free avatar
function JoinForm({ initialNickname }: { initialNickname: string }) {
  const { colors } = useTheme();
  const [accessCode, setAccessCode] = useState("");
  const [nickname, setNickname] = useState(initialNickname);
  const [avatar, setAvatar] = useState<Avatar | null>(null);

  const previewMutation = useMutation({ mutationFn: fetchHouseholdPreview });
  const joinMutation = useMutation(joinHouseholdMutationOptions);
  const preview = previewMutation.data;

  const code = accessCode.trim();
  const canSearch =
    code.length === ACCESS_CODE_LENGTH && !previewMutation.isPending;
  const canJoin =
    nickname.trim().length >= MIN_LENGTH &&
    avatar !== null &&
    !joinMutation.isPending;

  const handleSearch = () => {
    if (!canSearch) return;
    previewMutation.mutate(code);
  };

  const handleJoin = () => {
    if (!canJoin) return;
    joinMutation.mutate({
      accessCode: code,
      nickname: nickname.trim(),
      avatar,
    });
  };

  const handleChangeCode = () => {
    previewMutation.reset();
    joinMutation.reset();
    setAvatar(null);
  };

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
          <Text style={styles.welcomeEmoji}>🔑</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {preview ? preview.name : "Gå med i ett hushåll"}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {preview ? (
          <>
            <Field
              label="Ditt smeknamn"
              placeholder="Så ser de andra dig i hushållet"
              value={nickname}
              onChangeText={setNickname}
            />
            <AvatarPicker
              value={avatar}
              onChange={setAvatar}
              taken={preview.takenAvatars}
            />

            {joinMutation.error && (
              <Text style={[styles.error, { color: colors.text }]}>
                {joinMutation.error.message}
              </Text>
            )}

            <PrimaryButton
              icon="log-in"
              label="Gå med"
              disabled={!canJoin}
              loading={joinMutation.isPending}
              onPress={handleJoin}
            />
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleChangeCode}
              style={styles.link}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Byt kod
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Field
              label="Hushållets kod"
              placeholder={`${ACCESS_CODE_LENGTH} tecken`}
              value={accessCode}
              onChangeText={setAccessCode}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={ACCESS_CODE_LENGTH}
              returnKeyType="search"
            />

            {previewMutation.error && (
              <Text style={[styles.error, { color: colors.text }]}>
                {previewMutation.error.message}
              </Text>
            )}

            <PrimaryButton
              icon="search"
              label="Hitta hushåll"
              disabled={!canSearch}
              loading={previewMutation.isPending}
              onPress={handleSearch}
            />
          </>
        )}
      </View>
    </>
  );
}

function PrimaryButton({
  icon,
  label,
  disabled,
  loading,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: colors.primary,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Feather name={icon} size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{label}</Text>
        </>
      )}
    </Pressable>
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
  link: {
    alignSelf: "center",
  },
  linkText: {
    fontSize: 14,
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
