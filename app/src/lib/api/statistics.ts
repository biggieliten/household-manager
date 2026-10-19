import { getClient } from "./client";

export async function fetchHouseholdStatistics(householdId: number) {
  const res = await getClient().api.v1.households[
    ":householdId"
  ].statistics.$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta statistik (${res.status})`);

  return res.json();
}
