import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";

import { fonts, useAuthColors } from "@/components/auth/authColors";
import { GithubSignInButton } from "@/components/GithubSignInButton";
import { authClient } from "@/lib/auth-client";

const logo = require("@/assets/images/husallet_logo.webp");

type Mode = "signIn" | "signUp";

// Better Auth's default minimum password length
const MIN_PASSWORD_LENGTH = 8;

export default function SignIn() {
  const colors = useAuthColors();
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "signUp";
  const canSubmit =
    email.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    (!isSignUp || name.trim().length > 0) &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      const { error } = isSignUp
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
            rememberMe,
          });

      if (error) {
        setError(error.message ?? "Något gick fel");
        return;
      }
      setPassword("");
    } catch (e) {
      console.warn("Auth failed", e);
      setError("Kunde inte nå servern");
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleForgotPassword = () => {
    // TODO: needs sendResetPassword configured on the server
    Alert.alert("Glömt lösenord", "Återställning av lösenord kommer snart.");
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps='handled'>
          <View style={styles.header}>
            <Image
              source={logo}
              contentFit='contain'
              accessibilityLabel='Hushållet logotyp'
              style={styles.logo}
            />
            <Text style={[styles.appName, { color: colors.text }]}>
              Hushållet
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View
              accessibilityRole='tablist'
              style={[styles.segment, { backgroundColor: colors.segment }]}>
              <SegmentButton
                icon='log-in'
                label='Logga in'
                selected={!isSignUp}
                onPress={() => changeMode("signIn")}
              />
              <SegmentButton
                icon='user-plus'
                label='Skapa konto'
                selected={isSignUp}
                onPress={() => changeMode("signUp")}
              />
            </View>

            {isSignUp && (
              <Field
                icon='user'
                label='Namn'
                placeholder='Ditt namn'
                value={name}
                onChangeText={setName}
                autoComplete='name'
                textContentType='name'
              />
            )}

            <Field
              icon='mail'
              label='E-postadress'
              placeholder='namn@hushall.se'
              value={email}
              onChangeText={setEmail}
              autoCapitalize='none'
              autoComplete='email'
              keyboardType='email-address'
              textContentType='emailAddress'
            />

            <Field
              icon='lock'
              label='Lösenord'
              placeholder={
                isSignUp ? `Minst ${MIN_PASSWORD_LENGTH} tecken` : "••••••••"
              }
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize='none'
              autoComplete={isSignUp ? "new-password" : "current-password"}
              textContentType={isSignUp ? "newPassword" : "password"}
              labelAction={
                isSignUp ? undefined : (
                  <Pressable
                    accessibilityRole='link'
                    hitSlop={8}
                    onPress={handleForgotPassword}>
                    <Text style={[styles.link, { color: colors.primary }]}>
                      Glömt lösenord?
                    </Text>
                  </Pressable>
                )
              }
              trailing={
                <Pressable
                  accessibilityRole='button'
                  accessibilityLabel={
                    showPassword ? "Dölj lösenord" : "Visa lösenord"
                  }
                  hitSlop={8}
                  onPress={() => setShowPassword((v) => !v)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color={colors.text}
                  />
                </Pressable>
              }
            />

            {!isSignUp && (
              <Pressable
                accessibilityRole='checkbox'
                accessibilityState={{ checked: rememberMe }}
                onPress={() => setRememberMe((v) => !v)}
                style={styles.checkboxRow}>
                <View
                  style={[
                    styles.checkbox,
                    rememberMe
                      ? {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        }
                      : { borderColor: colors.textMuted },
                  ]}>
                  {rememberMe && (
                    <Feather name='check' size={16} color={colors.onPrimary} />
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                  Kom ihåg mig på denna enhet
                </Text>
              </Pressable>
            )}

            {error && (
              <Text style={[styles.error, { color: colors.primary }]}>
                {error}
              </Text>
            )}

            <Pressable
              accessibilityRole='button'
              accessibilityState={{ disabled: !canSubmit }}
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}>
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: colors.onPrimary },
                    ]}>
                    {isSignUp ? "Skapa konto" : "Logga in"}
                  </Text>
                  <Feather
                    name='arrow-right'
                    size={22}
                    color={colors.onPrimary}
                  />
                </>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View
                style={[styles.line, { backgroundColor: colors.divider }]}
              />
              <Text style={[styles.dividerText, { color: colors.text }]}>
                eller fortsätt med
              </Text>
              <View
                style={[styles.line, { backgroundColor: colors.divider }]}
              />
            </View>

            <GithubSignInButton />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  const colors = useAuthColors();

  return (
    <Pressable
      accessibilityRole='tab'
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.segmentButton,
        selected && [
          styles.segmentButtonActive,
          { backgroundColor: colors.segmentActive },
        ],
      ]}>
      <Feather
        name={icon}
        size={18}
        color={selected ? colors.text : colors.textMuted}
      />
      <Text
        style={[
          styles.segmentText,
          { color: selected ? colors.text : colors.textMuted },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Field({
  icon,
  label,
  labelAction,
  trailing,
  ...inputProps
}: TextInputProps & {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  labelAction?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const colors = useAuthColors();

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Feather name={icon} size={16} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {labelAction && <View style={styles.labelAction}>{labelAction}</View>}
      </View>
      <View style={[styles.inputWrap, { backgroundColor: colors.field }]}>
        <TextInput
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { color: colors.text }]}
          {...inputProps}
          accessibilityLabel={label}
        />
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
  },
  // Matches the logo's 795x586 aspect ratio
  logo: {
    width: 65,
    height: 48,
  },
  appName: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  segment: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 5,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
  },
  segmentButtonActive: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  field: {
    gap: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  labelAction: {
    marginLeft: "auto",
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 64,
    borderRadius: 16,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
});
