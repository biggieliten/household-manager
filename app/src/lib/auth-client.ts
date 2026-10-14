import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  // Base URL of the Hono API (not Metro). On a physical device, set
  // EXPO_PUBLIC_API_URL to a URL the phone can reach (e.g. your ngrok URL).
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
  plugins: [
    expoClient({
      scheme: "household-manager",
      storagePrefix: "household-manager",
      storage: SecureStore,
    }),
  ],
});
