import { getClient } from "./client";

export async function fetchHousehold(householdId: number) {
  const res = await getClient().api.v1.households[":householdId"].$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta hushållet (${res.status})`);

  return res.json();
}
