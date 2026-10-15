import type { HouseholdStatistics } from "@/types/statistics";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// TODO: replace with the active household once auth/household selection exists
export const HOUSEHOLD_ID = 11;

export async function fetchHouseholdStatistics(
  householdId: number,
): Promise<HouseholdStatistics> {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL saknas i app/.env");

  const res = await fetch(`${API_URL}/households/${householdId}/statistics`);
  if (!res.ok) throw new Error(`Kunde inte hämta statistik (${res.status})`);

  return res.json() as Promise<HouseholdStatistics>;
}
