import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import AnimatedSplash, { LOOP_DURATION_MS } from "@/components/AnimatedSplash";
import HeaderLogo from "@/components/HeaderLogo";
import { authClient } from "@/lib/auth-client";
import { householdsQueryOptions } from "@/options/households";
import { ThemeProvider } from "@/theme";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

// Keep the native splash up until the animated one has rendered
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Gesture Handler needs one root view for gestures such as swipe-to-delete;
  // without a style it fills the screen (flex: 1)
  return (
    <GestureHandlerRootView>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <StatusBar style="auto" />
          <RootStack />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const isSignedIn = !!session;
  const households = useQuery({
    ...householdsQueryOptions,
    enabled: isSignedIn,
  });

  // Show at least one full lap of the splash animation, even on a fast start
  const [hasShownSplash, setHasShownSplash] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setHasShownSplash(true), LOOP_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // Fall back to the system font if loading fails
  if (
    !hasShownSplash ||
    isSessionPending ||
    (isSignedIn && households.isPending) ||
    (!fontsLoaded && !fontError)
  ) {
    return <AnimatedSplash onLayout={() => SplashScreen.hideAsync()} />;
  }

  // On error, show the tabs: their screens already show the error message
  const hasHousehold = households.isError || (households.data?.length ?? 0) > 0;

  // Expo Router redirects automatically when a guard flips, e.g. after sign-in/out
  return (
    <Stack screenOptions={{ headerRight: () => <HeaderLogo /> }}>
      <Stack.Protected guard={isSignedIn && hasHousehold}>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "Tillbaka" }}
        />
        <Stack.Screen
          name="create-task"
          options={({ route }) => {
            const params = route.params as { id?: string | number } | undefined;

            return {
              presentation: "modal",
              title: params?.id ? "Redigera syssla" : "Lägg till syssla",
            };
          }}
        />
        <Stack.Screen name="profile" options={{ title: "Profil" }} />
        <Stack.Screen
          name="create-task-group"
          options={({ route }) => {
            const params = route.params as { id?: string } | undefined;
            return {
              title: params?.id ? "Redigera sysslegrupp" : "Skapa sysslegrupp",
            };
          }}
        />
        <Stack.Screen
          name="[id]"
          options={({ route }) => {
            const params = route.params as { name?: string } | undefined;

            return {
              title: params?.name ?? "Syssla",
              headerRight: undefined,
            };
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen
          name="create-household"
          options={{ title: "Skapa hushåll" }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
