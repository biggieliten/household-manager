import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import { ThemeProvider, useTheme } from "@/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <StatusBar style='auto' />
        <RootStack />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootStack() {
  const { colors } = useTheme();
  const { data: session, isPending } = authClient.useSession();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // Fall back to the system font if loading fails
  if (isPending || (!fontsLoaded && !fontError)) {
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
