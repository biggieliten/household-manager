import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";

import { ThemeProvider } from "@/theme";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-task"
          options={{ presentation: "modal", title: "Skapa syssla" }}
        />
      </Stack>
    </ThemeProvider>
  );
}
