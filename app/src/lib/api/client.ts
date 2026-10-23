import type { AppType } from "@api/index";
import { hc } from "hono/client";

import { authClient } from "@/lib/auth-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// On native the session lives in SecureStore, so it has to be sent as a cookie header.
// Also used by expo-image and expo-audio, which load task media straight from the API
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookie = await authClient.getCookie();
  return cookie ? { cookie } : {};
}

// One typed client for the whole app; routes and response types come from the API
const client = API_URL
  ? hc<AppType>(API_URL, {
      init: { credentials: "omit" },
      headers: getAuthHeaders,
    })
  : null;

export function getClient() {
  if (!client) throw new Error("EXPO_PUBLIC_API_URL saknas i app/.env");
  return client;
}
