import type { AppType } from "@api/index";
import { hc } from "hono/client";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// One typed client for the whole app; routes and response types come from the API
const client = API_URL ? hc<AppType>(API_URL) : null;

// TODO: replace with the active household once the household provider exists
export const HOUSEHOLD_ID = 1;

export function getClient() {
  if (!client) throw new Error("EXPO_PUBLIC_API_URL saknas i app/.env");
  return client;
}
