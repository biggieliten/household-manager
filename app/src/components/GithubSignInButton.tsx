import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/theme";

export function GithubSignInButton() {
  const { colors } = useTheme();
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
      accessibilityState={{ disabled: loading }}
      disabled={loading}
      onPress={signInGithub}
      style={[
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={[styles.text, { color: colors.text }]}>
          Fortsätt med GitHub
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 17,
    fontWeight: "600",
  },
});
