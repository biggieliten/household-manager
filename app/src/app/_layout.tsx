import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import LoadingView from "@/components/LoadingView";
import { authClient } from "@/lib/auth-client";
import { ThemeProvider, useTheme } from "@/theme";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { householdsQueryOptions } from "@/options/households";

const queryClient = new QueryClient();

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
  const { colors } = useTheme();
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

  // Fall back to the system font if loading fails
  if (
    isSessionPending ||
    (isSignedIn && households.isPending) ||
    (!fontsLoaded && !fontError)
  ) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LoadingView />
      </View>
    );
  }

  // On error, show the tabs: their screens already show the error message
  const hasHousehold = households.isError || (households.data?.length ?? 0) > 0;

  // Expo Router redirects automatically when a guard flips, e.g. after sign-in/out
  return (
    <Stack>
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
