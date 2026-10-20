import Storage from "expo-sqlite/kv-store";

import type { MyHousehold } from "@shared/schemas/household-schema";
import { responseMyHouseholdSchema } from "@shared/schemas/household-schema";
import { getClient } from "./client";

const ACTIVE_HOUSEHOLD_KEY = "active-household-id";

export async function fetchMyHouseholds(): Promise<MyHousehold[]> {
  const res = await getClient().api.v1.households.$get();
  if (!res.ok) throw new Error(`Kunde inte hämta hushåll (${res.status})`);

  return responseMyHouseholdSchema.array().parse(await res.json());
}

// The stored choice only counts while the user is still a member there
export async function getActiveHouseholdId(
  households: MyHousehold[],
): Promise<number | null> {
  const storedId = Number(await Storage.getItem(ACTIVE_HOUSEHOLD_KEY));
  const active =
    households.find((household) => household.id === storedId) ?? households[0];
  return active?.id ?? null;
}

export async function setActiveHouseholdId(householdId: number) {
  await Storage.setItem(ACTIVE_HOUSEHOLD_KEY, String(householdId));
}
