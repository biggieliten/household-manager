import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import { ThemeProvider, useTheme } from "@/theme";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StatusBar style='auto' />
      <RootStack />
    </ThemeProvider>
  );
}

function RootStack() {
  const { colors } = useTheme();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}>
        <ActivityIndicator />
      </View>
    );
  }

  const isSignedIn = !!session;

  // Expo Router redirects automatically when a guard flips, e.g. after sign-in/out
  return (
    <Stack>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen
          name='create-task'
          options={{ presentation: "modal", title: "Skapa syssla" }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name='sign-in' options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
