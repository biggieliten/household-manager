import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { GithubSignInButton } from "@/components/GithubSignInButton";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/theme";

type Mode = "signIn" | "signUp";

// Better Auth's default minimum password length
const MIN_PASSWORD_LENGTH = 8;

export default function SignIn() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        : await authClient.signIn.email({ email: email.trim(), password });

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

  const toggleMode = () => {
    setMode(isSignUp ? "signIn" : "signUp");
    setError(null);
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps='handled'>
      <Text style={[styles.title, { color: colors.text }]}>
        {isSignUp ? "Skapa konto" : "Logga in"}
      </Text>

      {isSignUp && (
        <TextInput
          placeholder='Namn'
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoComplete='name'
          textContentType='name'
          style={inputStyle}
        />
      )}
      <TextInput
        placeholder='E-post'
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize='none'
        autoComplete='email'
        keyboardType='email-address'
        textContentType='emailAddress'
        style={inputStyle}
      />
      <TextInput
        placeholder={
          isSignUp ? `Lösenord (minst ${MIN_PASSWORD_LENGTH} tecken)` : "Lösenord"
        }
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize='none'
        autoComplete={isSignUp ? "new-password" : "current-password"}
        textContentType={isSignUp ? "newPassword" : "password"}
        style={inputStyle}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        accessibilityRole='button'
        accessibilityState={{ disabled: !canSubmit }}
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={[
          styles.button,
          { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.5 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color='#FFFFFF' />
        ) : (
          <Text style={styles.buttonText}>
            {isSignUp ? "Skapa konto" : "Logga in"}
          </Text>
        )}
      </Pressable>

      <Pressable accessibilityRole='button' onPress={toggleMode}>
        <Text style={[styles.toggle, { color: colors.primary }]}>
          {isSignUp
            ? "Har du redan ett konto? Logga in"
            : "Inget konto? Skapa ett"}
        </Text>
      </Pressable>

      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text style={{ color: colors.textMuted }}>eller</Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <GithubSignInButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 48,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
  },
  error: {
    color: "#D32F2F",
    fontSize: 15,
  },
  button: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  toggle: {
    textAlign: "center",
    fontSize: 15,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
