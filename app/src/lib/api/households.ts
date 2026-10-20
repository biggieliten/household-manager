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

export async function fetchHousehold(householdId: number) {
  const res = await getClient().api.v1.households[":householdId"].$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta hushållet (${res.status})`);

  return res.json();
}

export async function pauseMember(householdId: number, memberId: number) {
  const res = await getClient().api.v1.households[":householdId"].members[
    ":memberId"
  ].pause.$post({
    param: { householdId: String(householdId), memberId: String(memberId) },
  });
  if (!res.ok) throw new Error(`Kunde inte pausa medlemmen (${res.status})`);

  return res.json();
}

export async function resumeMember(householdId: number, memberId: number) {
  const res = await getClient().api.v1.households[":householdId"].members[
    ":memberId"
  ].resume.$post({
    param: { householdId: String(householdId), memberId: String(memberId) },
  });
  if (!res.ok)
    throw new Error(`Kunde inte återaktivera medlemmen (${res.status})`);

  return res.json();
}

export async function promoteMember(householdId: number, memberId: number) {
  const res = await getClient().api.v1.households[":householdId"].members[
    ":memberId"
  ].promote.$post({
    param: { householdId: String(householdId), memberId: String(memberId) },
  });
  if (!res.ok)
    throw new Error(`Kunde inte göra medlemmen till ägare (${res.status})`);

  return res.json();
}
