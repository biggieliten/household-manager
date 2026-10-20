import type { AppType } from "@api/index";
import { hc } from "hono/client";

import { authClient } from "@/lib/auth-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// One typed client for the whole app; routes and response types come from the API.
// On native the session lives in SecureStore, so it has to be sent as a cookie header
const client = API_URL
  ? hc<AppType>(API_URL, {
      init: { credentials: "omit" },
      headers: async (): Promise<Record<string, string>> => {
        const cookie = await authClient.getCookie();
        return cookie ? { cookie } : {};
      },
    })
  : null;

// TODO: replace with the active household once the household provider exists
export const HOUSEHOLD_ID = 1;

export function getClient() {
  if (!client) throw new Error("EXPO_PUBLIC_API_URL saknas i app/.env");
  return client;
}
