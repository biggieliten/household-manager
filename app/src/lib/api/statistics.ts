import type { StatisticsPeriod } from "@/lib/statistics-period";

import { getClient } from "./client";

export async function fetchHouseholdStatistics(
  householdId: number,
  period: StatisticsPeriod,
) {
  const res = await getClient().api.v1.households[
    ":householdId"
  ].statistics.$get({
    param: { householdId: String(householdId) },
    query: { from: period.from.toISOString(), to: period.to.toISOString() },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta statistik (${res.status})`);

  return res.json();
}
