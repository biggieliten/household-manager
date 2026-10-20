import Feather from "@expo/vector-icons/Feather";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { fonts, useAuthColors } from "@/components/auth/authColors";
import { authClient } from "@/lib/auth-client";

export function GithubSignInButton() {
  const colors = useAuthColors();
  const inFlight = useRef(false);
  const [loading, setLoading] = useState(false);

  const signInGithub = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);

    try {
      // Close any stale browser/auth session left over from before (iOS)
      try {
        WebBrowser.dismissAuthSession();
      } catch {}
      try {
        await WebBrowser.dismissBrowser();
      } catch {}

      // On success the session updates and the root layout redirects to the tabs
      const { error } = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
      });

      if (error) {
        console.error(error);
      }
    } catch (e) {
      // Catches the WebBrowserAlreadyOpenException instead of crashing
      console.warn("Sign-in failed", e);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel='Fortsätt med GitHub'
      accessibilityState={{ disabled: loading }}
      disabled={loading}
      onPress={signInGithub}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.field, opacity: pressed ? 0.7 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          <Feather name='github' size={20} color={colors.text} />
          <Text style={[styles.text, { color: colors.text }]}>GitHub</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 14,
  },
  text: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
});
